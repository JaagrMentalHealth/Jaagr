const express = require("express");
const router = express.Router();
const symptomController = require("../controllers/symptomController");

router.post("/", symptomController.createSymptom);
router.post("/bult", symptomController.createSymptomsBulk);

router.get("/", symptomController.getSymptoms);
router.delete("/:id", symptomController.deleteSymptom);

module.exports = router;
