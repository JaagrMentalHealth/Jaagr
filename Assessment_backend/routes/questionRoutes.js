const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");

router.post("/", questionController.createQuestion);
router.get("/", questionController.getQuestions);
router.post("/bulk-upload", questionController.bulkUploadQuestions);
router.delete("/:id", questionController.deleteQuestion);

module.exports = router;
