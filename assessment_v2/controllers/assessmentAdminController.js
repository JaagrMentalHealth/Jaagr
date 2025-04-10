const AssessmentTypes = require("../models/Assessment");

exports.createAssessment = async (req, res) => {
  try {
    const assessment = new AssessmentTypes(req.body);
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
    const assessment = await AssessmentTypes.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json(assessment);
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
