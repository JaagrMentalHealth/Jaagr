const express = require("express")
const router = express.Router()
const {
  createAssessment,
  getAssessmentsByOrg,
} = require("../controllers/assessmentController")

// POST - Create assessment
router.post("/", createAssessment)

// GET - Assessments for org
router.get("/organization/:orgId", getAssessmentsByOrg)

module.exports = router
