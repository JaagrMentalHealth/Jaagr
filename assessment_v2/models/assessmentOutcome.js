// models/AssessmentOutcome.js

const mongoose = require("mongoose");

const AssessmentOutcomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation" },

  assessmentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentTypes",
    required: true,
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment", // newly re-added
  },

  date: { type: Date, default: Date.now },
  durationInMinutes: Number,

  warmupResponses: [
    { questionId: mongoose.Schema.Types.ObjectId, answer: String },
  ],
  screeningResponses: [
    { questionId: mongoose.Schema.Types.ObjectId, answer: String },
  ],
  severityResponses: [
    { questionId: mongoose.Schema.Types.ObjectId, answer: String },
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
