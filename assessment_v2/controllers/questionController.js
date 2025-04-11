const Question = require("../models/Question");
const Disease = require("../models/Disease");

// Create Question
exports.createQuestion = async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Bulk Upload Questions
exports.bulkUploadQuestions = async (req, res) => {
  try {
    const incomingQuestions = req.body;

    const diseases = await Disease.find({}, "diseaseName _id");
    const diseaseMap = {};
    diseases.forEach((d) => {
      diseaseMap[d.diseaseName.toLowerCase()] = d._id;
    });

    const preparedQuestions = incomingQuestions.map((q) => {
      const diseaseName = q.disease?.toLowerCase();
      const diseaseId = diseaseMap[diseaseName] || null;

      return {
        questionName: q.questionName,
        optionType: q.optionType,
        options: q.options,
        validOptions: q.validOptions,
        disease: diseaseId,
        phase: q.phase,
      };
    });

    const questions = await Question.insertMany(preparedQuestions);
    res.status(201).json(questions);
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Get All Questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().populate("disease");
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate("disease");
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Question by ID
exports.updateQuestion = async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Question by ID
exports.deleteQuestion = async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
