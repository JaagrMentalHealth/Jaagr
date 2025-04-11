const mongoose = require("mongoose");

const AssessmentOutcomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organisation",
    required: false,
  },
  // 👇 Updated field to refer to AssessmentTypes model
  assessmentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentTypes",
    required: true, // Make it required if every outcome must map to an assessment type
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
