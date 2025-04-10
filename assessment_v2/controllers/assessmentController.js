const Question = require("../models/Question");
const Disease = require("../models/Disease");
const AssessmentTypes = require("../models/Assessment");
const AssessmentOutcome = require("../models/assessmentOutcome");
const User = require("../../models/User");
const OrgUser = require("../../admin_application/models/orgUser");

// Get warmup questions for an assessment
exports.getWarmupQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.query;

    const assessment = await AssessmentTypes.findById(assessmentId).populate("questions");

    if (!assessment || assessment.status !== "active") {
      return res.status(400).json({ error: "Invalid or inactive assessment" });
    }
    console.log(assessment.questions)

    const warmupQuestions = assessment.questions.filter(q => q.phase === 0);
    res.status(200).json(warmupQuestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Submit warmup and generate screening questions
exports.submitWarmup = async (req, res) => {
  try {
    const { warmupAnswers, organizationId, assessmentId, orgUserId } = req.body;
    const jwtUserId = req.user ? req.user._id : null;
    const finalUserId = jwtUserId || orgUserId;

    if (!finalUserId) {
      return res.status(400).json({ error: "User or OrgUser ID is required" });
    }

    // Determine assessmentId to use
    let finalAssessment;
    if (assessmentId) {
      finalAssessment = await AssessmentTypes.findById(assessmentId);
    } else if (jwtUserId) {
      finalAssessment = await AssessmentTypes.findOne({ title: "Mental Wellbeing V1" });
    }

    if (!finalAssessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const outcome = new AssessmentOutcome({
      userId: finalUserId,
      organizationId,
      assessmentId: finalAssessment._id,
      type: finalAssessment.title || "Mental Wellbeing V1",
      warmupResponses: warmupAnswers,
    });

    await outcome.save();

    if (jwtUserId) {
      await User.findByIdAndUpdate(jwtUserId, {
        $push: { assessment: outcome._id },
      });
    }

    const fullAssessment = await AssessmentTypes.findById(finalAssessment._id).populate("questions");
    const screeningQuestions = fullAssessment.questions.filter(q => q.phase === 1);

    return res.status(200).json({
      screeningQuestions,
      outcomeId: outcome._id,
    });
  } catch (error) {
    console.error("Submit Warmup Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};

// Submit screening and get severity questions
exports.submitScreening = async (req, res) => {
  try {
    const { screeningAnswers, outcomeId } = req.body;

    const outcome = await AssessmentOutcome.findById(outcomeId);
    if (!outcome) return res.status(404).json({ error: "Outcome not found" });

    outcome.screeningResponses = screeningAnswers;
    await outcome.save();

    const assessment = await AssessmentTypes.findById(outcome.assessmentId)
      .populate("questions")
      .populate("diseases");

    const screeningQuestions = assessment.questions.filter(q => q.phase === 1);
    const flaggedDiseases = [];

    for (const disease of assessment.diseases) {
      const diseaseQuestions = screeningQuestions.filter(q => q.disease?.toString() === disease._id.toString());

      const validCount = screeningAnswers.filter((ans) =>
        diseaseQuestions.some(
          (q) => q._id.equals(ans.questionId) && q.validOptions.includes(ans.answer)
        )
      ).length;

      // Screening threshold is optional — fixed for now
      if (validCount >= 1) {
        flaggedDiseases.push(disease._id);
      }
    }

    const severityQuestions = assessment.questions.filter(
      q => q.phase === 2 && flaggedDiseases.some(dId => q.disease?.toString() === dId.toString())
    );

    res.status(200).json({ severityQuestions });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Submit severity and return results
exports.submitSeverity = async (req, res) => {
  try {
    const { severityAnswers, outcomeId } = req.body;

    const outcome = await AssessmentOutcome.findById(outcomeId);
    if (!outcome) return res.status(404).json({ error: "Outcome not found" });

    outcome.severityResponses = severityAnswers;

    const assessment = await AssessmentTypes.findById(outcome.assessmentId)
      .populate("questions")
      .populate("diseases");

    const results = [];

    for (const disease of assessment.diseases) {
      const criteria = assessment.scoringCriteria.find(c => c.diseaseId.toString() === disease._id.toString()) || {};
      const moderateThreshold = criteria.moderate || 2;
      const severeThreshold = criteria.severe || 4;

      const relevantQuestions = assessment.questions.filter(
        q => q.disease?.toString() === disease._id.toString() && q.phase === 2
      );

      const severityCount = severityAnswers.filter((ans) =>
        relevantQuestions.some(
          (q) => q._id.equals(ans.questionId) && q.validOptions.includes(ans.answer)
        )
      ).length;

      let severityLevel = "Mild";
      if (severityCount >= severeThreshold) severityLevel = "Severe";
      else if (severityCount >= moderateThreshold) severityLevel = "Moderate";

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

    // Update count in assessment
    await Assessment.findByIdAndUpdate(outcome.assessmentId, {
      $inc: { completedCount: 1 },
    });

    res.status(200).json({
      message: "Assessment completed",
      outcomeId: outcome._id,
      results,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get outcome by ID
exports.getOutcomeById = async (req, res) => {
  try {
    const outcome = await AssessmentOutcome.findById(req.params.outcomeId);
    if (!outcome) {
      return res.status(404).json({ error: "Outcome not found" });
    }
    res.status(200).json(outcome);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
