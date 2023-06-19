const mongoose = require("mongoose");
const schema = mongoose.Schema;

const userSchema = new schema({
  username: String,
  email: String,
  password: String,
});

module.exports = mongoose.model("User", userSchema);
