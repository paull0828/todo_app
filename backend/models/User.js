const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: { type: String, unique: true },
  phone: String,
  password: String,
});

module.exports = mongoose.model("User", userSchema);
