// models/Assessment.js
const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  diseases: [{ type: mongoose.Schema.Types.ObjectId, ref: "Disease" }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  numQuestions: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" },
  completedCount: { type: Number, default: 0 },
  specificInstructions: { type: String },
  estimatedTime: { type: Number, default: 5 }, // ✅ <-- Add this line
  scoringCriteria: [{
    diseaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Disease" },
    moderate: Number,
    severe: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model("AssessmentTypes", AssessmentSchema);
