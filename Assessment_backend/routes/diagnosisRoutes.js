const express = require("express");
const router = express.Router();
const diagnosisController = require("../controllers/diagnosisController");

router.post("/phase1", diagnosisController.diagnose);
router.post("/phase2",diagnosisController.diagnosePhase2);

module.exports = router;
