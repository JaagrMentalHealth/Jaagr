// routes/diseaseRoutes.js
const express = require("express");
const router = express.Router();
const diseaseController = require("../controllers/diseaseController");

router.post("/", diseaseController.createDisease);
router.post("/bulk", diseaseController.bulkUploadDiseases);
// Add other routes (get, update, delete) as needed.

router.get("/", diseaseController.getAllDiseases);
router.get("/:id", diseaseController.getDiseaseById);
router.put("/:id", diseaseController.updateDisease);
router.delete("/:id", diseaseController.deleteDisease);

module.exports = router;