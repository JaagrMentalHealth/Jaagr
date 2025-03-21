// routes/assessmentRoutes.js
const express = require("express");
const router = express.Router();
const assessmentController = require("../controllers/assessmentController");

router.get("/warmup", assessmentController.getWarmupQuestions);
router.post("/submit-warmup", assessmentController.submitWarmup);
router.post("/submit-screening", assessmentController.submitScreening);
router.post("/submit-severity", assessmentController.submitSeverity);

module.exports = router;