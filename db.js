const mongoose = require("mongoose");

mongoose.connect(process.env.mongoURL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

mongoose.connection
  .on("connected", () =>
    console.log("\x1b[35m%s\x1b[0m", "connected to database successful")
  )
  .on("error", err => {
    console.log("\x1b[33m%s\x1b[0m", "Connection to the DB failed", err);
  });
