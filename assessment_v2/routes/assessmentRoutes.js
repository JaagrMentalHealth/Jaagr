// routes/assessmentRoutes.js
const express = require("express");
const router = express.Router();
const assessmentController = require("../controllers/assessmentController");
const authMiddleware=require("../../middleware/auth")

router.get("/warmup", assessmentController.getWarmupQuestions);
router.post("/submit-warmup",authMiddleware.optionalAuth, assessmentController.submitWarmup);
router.post("/submit-screening", assessmentController.submitScreening);
router.post("/submit-severity", assessmentController.submitSeverity);
router.get("/outcome/:outcomeId",assessmentController.getOutcomeById)
router.delete("/outcome/:orgUserId",assessmentController.deleteOutcomeByOrgUser)

module.exports = router;