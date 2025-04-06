const express = require("express")
const router = express.Router()
const {
  createAssessment,
  getAssessmentsByOrg,
  exportAssessmentReport
} = require("../controllers/assessmentController")

// POST - Create assessment
router.post("/", createAssessment)

// GET - Assessments for org
router.get("/organization/:orgId", getAssessmentsByOrg)

router.get("/assessment/export/:assessmentId", exportAssessmentReport);

module.exports = router
