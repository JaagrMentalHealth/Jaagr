const mongoose = require("mongoose")

const OrgUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment"},
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true },
  metadata: Object // optional: designation, batch, etc.
})

module.exports = mongoose.model("OrgUser", OrgUserSchema)
