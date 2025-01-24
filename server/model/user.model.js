const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true }, //unique:true - Automatically generated index
  email: { type: String, required: true, unique: true }, //unique:true - Automatically generated index
  role: [
    { type: String, enum: ["admin", "student", "teacher"], required: true },
  ],
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    default: null,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
