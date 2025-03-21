// models/Question.js
const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionName: { type: String, required: true },
  optionType: {
    type: String,
    enum: ["Slider", "Radio", "Buttons", "Emoji"],
    required: true,
  },
  options: { type: [String], required: true }, // Array of options
  validOptions: { type: [String], required: true }, // Valid options for screening
  disease: { type: mongoose.Schema.Types.ObjectId, ref: "Disease" }, // Reference to Disease
  phase: { type: Number, enum: [0, 1, 2], required: true }, // 0: Warmup, 1: Screening, 2: Severity
});

module.exports = mongoose.model("Question", QuestionSchema);