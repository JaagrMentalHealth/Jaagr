const mongoose = require("mongoose")

const OrgUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment"},
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true },
  token: { type: String, unique: true },
  metadata: Object // optional: designation, batch, etc.
}, { timestamps: true })

module.exports = mongoose.model("OrgUser", OrgUserSchema)
