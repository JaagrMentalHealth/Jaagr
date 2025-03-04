const express = require("express");
const router = express.Router();
const diseaseController = require("../controllers/diseaseController");

router.post("/", diseaseController.createDisease);
router.post("/bulk", diseaseController.createDiseasesBulk);

router.get("/", diseaseController.getDiseases);
router.delete("/:id", diseaseController.deleteDisease);

module.exports = router;
