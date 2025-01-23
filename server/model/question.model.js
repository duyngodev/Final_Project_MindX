const mongoose = require("mongoose");

const questionSchema = mongoose.Schema(
  {
    topic: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["choice", "multiChoice", "textInput"],
    },
    level: {
      type: String,
      required: true,
      enum: ["nhanBiet", "thonHieu", "vanDung"],
    },
    question: { type: String, required: true },
    answer: [{ type: String, required: true }],
    subject: { type: String, required: true },
    class: { type: Number, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    author: { type: String, required: true },
    public: {
      type: String,
      required: true,
      enum: ["public", "protected"],
      default: "protected",
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
