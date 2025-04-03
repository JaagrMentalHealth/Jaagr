const Assessment = require("../models/Assessment")

// Create Assessment under an organization
exports.createAssessment = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      duration,
      validUntil,
      organizationId,
    } = req.body

    const newAssessment = await Assessment.create({
      name,
      type,
      description,
      duration,
      validUntil,
      organizationId,
    })

    res.status(201).json(newAssessment)
  } catch (error) {
    res.status(400).json({ error: "Failed to create assessment", details: error.message })
  }
}

// Optional: Get all assessments under an org
exports.getAssessmentsByOrg = async (req, res) => {
  try {
    const assessments = await Assessment.find({ organizationId: req.params.orgId })
    res.status(200).json(assessments)
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch assessments", details: error.message })
  }
}
