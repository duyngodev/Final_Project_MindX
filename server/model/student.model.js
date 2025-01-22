const mongoose = require("mongoose");

const studentSchema = mongoose.Schema({
  name: { type: String },
  password: { type: String, required: true },
  imageUrl: { type: String },
  age: { type: Number, min: 1, max: 100},
  sex: [
    {
      type: String,
      enum: ["male", "female", "other"],
    },
  ],
  department: { type: String },
});

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
