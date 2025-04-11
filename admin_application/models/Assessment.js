const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // 👇 Updated: Reference to AssessmentTypes schema
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentTypes", // This must match what you used in model name
    required: true
  },

  description: { type: String },
  duration: { type: Number }, // in minutes
  validUntil: { type: Date },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organisation",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Assessment", AssessmentSchema);
