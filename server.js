require("dotenv").config();
const path = require("path");
const express = require("express");
const pug = require("pug");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const socketIO = require("socket.io");
const httpServer = require("http");

const User = require("./models");
const secret = "random-secret";

/** database */
require("./db");

const app = express();
const server = httpServer.Server(app);
const io = socketIO(server);

app.set("view engine", "pug");
app.set("views", path.resolve(__dirname, "views"));

/** middleware */

app.use("/", express.static(path.resolve(__dirname, "public")));
app.use(express.json());

const isAuthenticated = (req, res, next) => {
  let authorization;
  const cookies = cookie.parse(req.headers.cookie || "");
  authorization = req.headers["authorization"] || cookies.access_token;
  if (authorization) {
    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, secret);
    res.locals.email = decoded.email;
    return next();
  }
  return res.redirect("/login");
};

/** page routes */
app.get("/", isAuthenticated, (req, res) => {
  return res.sendFile(__dirname + "/home.html");
});

app.get("/about", isAuthenticated, (req, res) => {
  return res.sendFile(__dirname + "/about.html");
});

app.get("/chat", isAuthenticated, (req, res) => {
  return res.sendFile(__dirname + "/chat.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

/**API endpoints */
app.post("/signIn", async (req, res) => {
  const { email, password } = req.body;
  const foundUser = await User.findOne({ email });
  if (foundUser) {
    const passwordMatch = await foundUser.comparePasswords(password);
    if (passwordMatch) {
      const token = authenticate(email, res);
      return res.status(200).json({ token });
    }
    return res.status(400).json({ msg: "invalid credentials" });
  }
  const newUser = await User.create({ email, password });
  const token = authenticate(email, res);
  return res.status(200).json({ token });
});

const port = process.env.PORT;

server.listen(port, err => {
  console.log(`server is running on port ${port}`);
});

function authenticate(email, res) {
  const token = jwt.sign({ email }, secret);
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("access_token", token, {
      maxAge: 60 * 60 * 24,
      httpOnly: true
    })
  );
  return token;
}

const verifySocketConnection = async (socket, next) => {
  const { query } = socket.handshake;
  if (query && query.token) {
    const decoded = jwt.verify(query.token, secret);
    const foundUser = await User.findOne({ email: decoded.email });
    if (foundUser) {
      socket.decoded = decoded;
      if (!foundUser.socketId) {
        await User.updateOne({ email: decoded.email }, { socketId: socket.id });
        next();
      } else {
        /** ensure each user have one socket connection */
        socket.disconnect();
        next(new Error("Authentication error"));
      }
    } else {
      /** email from token doesn't exist any more */
      socket.disconnect();
      next(new Error("Authentication error"));
    }
  } else {
    /** no token was provided */
    socket.disconnect();
    next(new Error("Authentication error"));
  }
};

/** socket */
io.use(verifySocketConnection).on("connection", socket => {
  socket.emit("msg", "Hi, there");

  socket.on("disconnect", async () => {
    await User.updateOne({ socketId: socket.id }, { socketId: "" });
  });
});