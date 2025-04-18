const Question = require("../models/Question");
const Disease = require("../models/Disease");
const AssessmentTypes = require("../models/Assessment");
const AssessmentOutcome = require("../models/assessmentOutcome");
const User = require("../../models/User");
const OrgUser = require("../../admin_application/models/orgUser");
const Assessment = require("../../admin_application/models/Assessment");



// Get warmup questions for an assessment
exports.getWarmupQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.query;
    let assessmentType = null;

    // 🔹 OrgUser Flow: assessmentId → Assessment → type (AssessmentTypes)
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // 🔹 Check if the assessment has expired
      if (assessment.validUntil && new Date(assessment.validUntil) < new Date()) {
        return res.status(410).json({ error: "This assessment has expired." });
      }

      assessmentType = await AssessmentTypes.findById(assessment.type).populate("questions");
      if (!assessmentType) {
        return res.status(404).json({ error: "Assessment type not found" });
      }
    }

    // 🔹 Default User Flow: Find default AssessmentTypes by title
    if (!assessmentType) {
      assessmentType = await AssessmentTypes.findOne({
        title: /Mental Health V1/i,
        status: "active",
      }).populate("questions");

      if (!assessmentType) {
        return res.status(404).json({ error: "Default assessment type not found" });
      }
    }

    // 🔹 Filter warmup questions (phase === 0)
    const warmupQuestions = assessmentType.questions.filter(q => q.phase === 0);
    return res.status(200).json(warmupQuestions);
  } catch (error) {
    console.error("Get Warmup Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};

// Submit warmup and generate screening questions
exports.submitWarmup = async (req, res) => {
  try {
    const { warmupAnswers, organizationId, assessmentId, orgUserId } = req.body;
    const jwtUserId = req.user ? req.user._id : null;
    const finalUserId = jwtUserId || orgUserId;
    console.log(jwtUserId==finalUserId)
    

    if (!finalUserId) {
      return res.status(400).json({ error: "User or OrgUser ID is required" });
    }

    let assessmentType = null;

    // 🔹 Org user flow (admin-based assessment)
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: "Linked assessment not found" });
      }

      assessmentType = await AssessmentTypes.findById(assessment.type).populate("questions");

      if (!assessmentType) {
        return res.status(404).json({ error: "Assessment type not found in admin setup" });
      }
    }

    // 🔹 General user flow (default assessment type)
    if (!assessmentType && jwtUserId) {
      assessmentType = await AssessmentTypes.findOne({ title: /Mental Health V1/i, status: "active" }).populate("questions");
      if (!assessmentType) {
        return res.status(404).json({ error: "Default assessment type not found" });
      }
    }

    // Create the outcome with reference to the assessmentType
    const outcome = new AssessmentOutcome({
      userId: finalUserId,
      organizationId,
      assessmentId,                       // ✅ Add this
      assessmentType: assessmentType._id,
      warmupResponses: warmupAnswers,
    });

    await outcome.save();

    if (jwtUserId) {
      await User.findByIdAndUpdate(jwtUserId, {
        $push: { assessment: outcome._id },
      });
    }

    // Filter warmup questions (phase 0)
    const screeningQuestions = assessmentType.questions.filter(q => q.phase === 1);

    return res.status(200).json({
      screeningQuestions: screeningQuestions,
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

    let assessmentType;

    if (outcome.assessmentType) {
      // Default user (or new logic)
      assessmentType = await AssessmentTypes.findById(outcome.assessmentType)
        .populate("questions")
        .populate("diseases");
    } else if (outcome.assessmentId) {
      // Org user via Assessment -> AssessmentTypes
      // const Assessment = require("../models/Assessment");
      const assessment = await Assessment.findById(outcome.assessmentId);
      assessmentType = await AssessmentTypes.findById(assessment.type)
        .populate("questions")
        .populate("diseases");
    }

    if (!assessmentType) return res.status(404).json({ error: "Assessment type not found" });

    const screeningQuestions = assessmentType.questions.filter(q => q.phase === 1);
    const flaggedDiseases = [];

    for (const disease of assessmentType.diseases) {
      const diseaseQuestions = screeningQuestions.filter(q => q.disease?.toString() === disease._id.toString());

      const validCount = screeningAnswers.filter(ans =>
        diseaseQuestions.some(q => q._id.equals(ans.questionId) && q.validOptions.includes(ans.answer))
      ).length;

      if (validCount >= 1) {
        flaggedDiseases.push(disease._id);
      }
    }

    const severityQuestions = assessmentType.questions.filter(
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

    let assessmentType;

    if (outcome.assessmentType) {
      assessmentType = await AssessmentTypes.findById(outcome.assessmentType)
        .populate("questions")
        .populate("diseases");
    } else if (outcome.assessmentId) {
      // const Assessment = require("../models/Assessment");
      const assessment = await Assessment.findById(outcome.assessmentId);
      assessmentType = await AssessmentTypes.findById(assessment.type)
        .populate("questions")
        .populate("diseases");
    }

    if (!assessmentType) return res.status(404).json({ error: "Assessment type not found" });

    const results = [];

    for (const disease of assessmentType.diseases) {
      const criteria = assessmentType.scoringCriteria.find(
        c => c.diseaseId.toString() === disease._id.toString()
      ) || {};

      const moderateThreshold = criteria.moderate || 2;
      const severeThreshold = criteria.severe || 4;

      const relevantQuestions = assessmentType.questions.filter(
        q => q.disease?.toString() === disease._id.toString() && q.phase === 2
      );

      const severityCount = severityAnswers.filter(ans =>
        relevantQuestions.some(q => q._id.equals(ans.questionId) && q.validOptions.includes(ans.answer))
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
          whatCanHelp: reportText.whatCanHelp || ""
        }
      });
    }

    outcome.results = results;
    await outcome.save();

    // Optional: if using assessmentId for org reporting
    if (outcome.assessmentType) {
      // const Assessment = require("../models/Assessment");
      await AssessmentTypes.findByIdAndUpdate(outcome.assessmentType, { $inc: { completedCount: 1 } });
    }

    res.status(200).json({
      message: "Assessment completed",
      outcomeId: outcome._id,
      results
    });
  } catch (error) {
    console.error(error);
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
