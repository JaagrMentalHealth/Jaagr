// controllers/assessmentController.js
const Question = require("../models/Question");
const Disease = require("../models/Disease");

// Generate Warmup Questions
exports.getWarmupQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ phase: 0 });
    res.status(200).json(questions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit Warmup and Generate Screening Questions
exports.submitWarmup = async (req, res) => {
  try {
    const screeningQuestions = await Question.find({ phase: 1 });
    res.status(200).json(screeningQuestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit Screening and Generate Severity Questions
exports.submitScreening = async (req, res) => {
  try {
    const { answers } = req.body; // Array of { questionId, answer }
    const diseases = await Disease.find();

    const flaggedDiseases = [];
    for (const disease of diseases) {
      const questions = await Question.find({ disease: disease._id, phase: 1 });
      const validCount = answers.filter((ans) =>
        questions.some(
          (q) =>
            q._id.equals(ans.questionId) && q.validOptions.includes(ans.answer)
        )
      ).length;

      if (validCount >= disease.minimumScreening) {
        flaggedDiseases.push(disease._id);
      }
    }

    const severityQuestions = await Question.find({
      disease: { $in: flaggedDiseases },
      phase: 2,
    });
    res.status(200).json(severityQuestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit Severity and Generate Report
exports.submitSeverity = async (req, res) => {
  try {
    const { answers } = req.body;
    const diseases = await Disease.find();

    const results = [];
    for (const disease of diseases) {
      const questions = await Question.find({ disease: disease._id, phase: 2 });
      const severityCount = answers.filter((ans) =>
        questions.some(
          (q) =>
            q._id.equals(ans.questionId) && q.validOptions.includes(ans.answer)
        )
      ).length;

      let severityLevel = "Mild";
      if (severityCount >= disease.minimumSeverity.severe) {
        severityLevel = "Severe";
      } else if (severityCount >= disease.minimumSeverity.moderate) {
        severityLevel = "Moderate";
      }

      results.push({
        disease: disease.diseaseName,
        severity: severityLevel,
      });
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};