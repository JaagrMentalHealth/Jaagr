const mongoose = require("mongoose");

// Embedded Question Schema
const QuestionSchema = new mongoose.Schema(
  {
    questionName: { type: String, required: true },
    optionType: {
      type: String,
      enum: ["Slider", "Radio", "Buttons", "Emoji"],
      required: true,
    },
    options: { type: [String], required: true },
    validOptions: { type: [String], required: true },
    disease: { type: mongoose.Schema.Types.ObjectId, ref: "Disease" },
    phase: { type: Number, enum: [0, 1, 2], required: true },
  }
  // { _id: false }
);

// Embedded Disease Schema
const DiseaseSchema = new mongoose.Schema(
  {
    diseaseName: { type: String, required: true },
    assessmentParameter: { type: String, required: true },
    minimumScreening: { type: Number, required: true },
    minimumSeverity: {
      mild: { type: Number, required: true },
      moderate: { type: Number, required: true },
      severe: { type: Number, required: true },
    },
    diseaseSeverity: {
      type: String,
      enum: ["Alarming", "Moderate", "Less Alarming"],
      required: true,
    },
    reportText: {
      mild: {
        whatItMeans: String,
        howItFeels: String,
        whatCanHelp: String,
      },
      moderate: {
        whatItMeans: String,
        howItFeels: String,
        whatCanHelp: String,
      },
      severe: {
        whatItMeans: String,
        howItFeels: String,
        whatCanHelp: String,
      },
    },
  }
  // { _id: false }
);

// Main AssessmentType Schema
const AssessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    diseases: [DiseaseSchema], // 🔁 Embedded
    questions: [QuestionSchema], // 🔁 Embedded
    numQuestions: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
    completedCount: { type: Number, default: 0 },
    specificInstructions: { type: String },
    estimatedTime: { type: Number, default: 5 },
    scoringCriteria: [
      {
        diseaseId: mongoose.Schema.Types.ObjectId,
        moderate: Number,
        severe: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentTypes", AssessmentSchema);
