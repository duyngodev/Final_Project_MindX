const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String },
  password: { type: String, required: true },
  imageUrl: { type: String },
  age: { type: Number, min: 1, max: 100 },
  sex: {
    type: String,
    enum: ["male", "female", "other"],
  },
  department: { type: String },
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
