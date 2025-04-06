const mongoose = require("mongoose")

const AssessmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g., "primary", "anxiety", etc.
  description: { type: String },
  duration: { type: Number }, // in minutes
  validUntil: { type: Date },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true },
}, { timestamps: true })

module.exports = mongoose.model("Assessment", AssessmentSchema)
