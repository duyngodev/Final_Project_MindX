const mongoose = require("mongoose");

const teacherSchema = mongoose.Schema({
  name: { type: String },
  password: { type: String, required: true },
  imageUrl: { type: String },
  age: { type: Number, min: 1, max: 100 },
  sex: [
    {
      type: String,
      enum: ["male", "female", "other"],
    },
  ],
  department: { type: String },
});

const Teacher = mongoose.model("Teacher", teacherSchema);
module.exports = Teacher;
