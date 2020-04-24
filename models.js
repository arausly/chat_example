const validator = require("validator");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: [true, "email is required for every user"],
    validate: {
      validator: val => validator.isEmail(val),
      message: "{VALUE} is not a valid email address"
    }
  },
  password: {
    type: String,
    trim: true,
    required: [true, "please provide a password"]
  },
  socketId: String,
  updatedAt: {
    type: Date,
    default: Date.now,
    required: [true, "please provide the updatedAt timestamp "]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: [true, "please provide the createdAt timestamp "]
  }
});

userSchema.pre("updateOne", function() {
  this.set({ updatedAt: Date.now() });
});

userSchema.pre("save", function(next) {
  const user = this;
  if (!user.isModified("password")) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePasswords = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("user", userSchema);
