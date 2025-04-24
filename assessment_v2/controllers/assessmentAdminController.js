const Question = require("../models/Question");
const Disease = require("../models/Disease");
const AssessmentTypes = require("../models/Assessment");

exports.createAssessment = async (req, res) => {
  try {
    const { diseases, questions, ...rest } = req.body;

    const assessment = new AssessmentTypes({
      ...rest,
      diseases, // frontend sends full disease array
      questions, // frontend sends full question array
      numQuestions: questions.length,
    });

    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getAllAssessments = async (req, res) => {
  try {
    const assessments = await AssessmentTypes.find()
      .populate("diseases")
      .populate("questions");
    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssessmentById = async (req, res) => {
  try {
    const assessment = await AssessmentTypes.findById(req.params.id)
      .populate("diseases")
      .populate("questions");
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Ensure numQuestions is updated only if questions are passed
    if (Array.isArray(updateData.questions)) {
      updateData.numQuestions = updateData.questions.length;
    }

    const updated = await AssessmentTypes.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await AssessmentTypes.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
