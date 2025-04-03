// models/AssessmentOutcome.js
const mongoose = require("mongoose");

const AssessmentOutcomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // or "OrgUser" if from organization
    required: false,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: false,
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: false,
  },
  type: {
    type: String,
    default: "Emotional Well Being V1",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  durationInMinutes: Number,
  warmupResponses: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
    },
  ],
  screeningResponses: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
    },
  ],
  severityResponses: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
    },
  ],
  results: [
    {
      disease: String,
      severity: String,
      assessmentParameter: String,
      reportText: {
        whatItMeans: String,
        howItFeels: String,
        whatCanHelp: String,
      },
    },
  ],
});

module.exports = mongoose.model("AssessmentOutcome", AssessmentOutcomeSchema);
