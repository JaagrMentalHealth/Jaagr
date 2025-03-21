// routes/questionRoutes.js
const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");

router.post("/", questionController.createQuestion);
router.post("/bulk", questionController.bulkUploadQuestions);
// Add other routes (get, update, delete) as needed.

module.exports = router;