// controllers/assessmentController.js
const Question = require("../models/Question");
const Disease = require("../models/Disease");
const AssessmentOutcome = require("../models/AssessmentOutcome");

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
    const { warmupAnswers, userId, organizationId, assessmentId } = req.body;

    // Create new outcome record
    const outcome = new AssessmentOutcome({
      userId,
      organizationId,
      assessmentId,
      type: "Emotional Well Being V1",
      warmupResponses: warmupAnswers,
    });

    await outcome.save();

    const screeningQuestions = await Question.find({ phase: 1 });
    res.status(200).json({ screeningQuestions, outcomeId: outcome._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit Screening and Generate Severity Questions
exports.submitScreening = async (req, res) => {
  try {
    const { screeningAnswers, outcomeId } = req.body;

    const outcome = await AssessmentOutcome.findById(outcomeId);
    if (!outcome) {
      return res.status(404).json({ error: "Outcome not found" });
    }

    outcome.screeningResponses = screeningAnswers;
    await outcome.save();

    const diseases = await Disease.find();
    const flaggedDiseases = [];

    for (const disease of diseases) {
      const questions = await Question.find({ disease: disease._id, phase: 1 });

      const validCount = screeningAnswers.filter((ans) =>
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

    res.status(200).json({ severityQuestions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit Severity and Generate Report
// Submit Severity and Generate Report
exports.submitSeverity = async (req, res) => {
  try {
    const { severityAnswers, outcomeId } = req.body;

    const outcome = await AssessmentOutcome.findById(outcomeId);
    if (!outcome) {
      return res.status(404).json({ error: "Outcome not found" });
    }

    outcome.severityResponses = severityAnswers;

    const diseases = await Disease.find();
    const results = [];

    for (const disease of diseases) {
      const questions = await Question.find({ disease: disease._id, phase: 2 });

      const severityCount = severityAnswers.filter((ans) =>
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

      const reportText = disease.reportText?.[severityLevel.toLowerCase()] || {};
      const parameter = disease.assessmentParameter || disease.diseaseName;

      results.push({
        disease: disease.diseaseName,
        severity: severityLevel,
        assessmentParameter: parameter,
        reportText: {
          whatItMeans: reportText.whatItMeans || "",
          howItFeels: reportText.howItFeels || "",
          whatCanHelp: reportText.whatCanHelp || "",
        },
      });
    }

    outcome.results = results;
    await outcome.save();

    res.status(200).json({
      message: "Assessment completed",
      outcomeId: outcome._id,
      results,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
