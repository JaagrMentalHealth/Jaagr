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
    const { assessmentId, orgUserId, organizationId } = req.query;
    const jwtUserId = req.user ? req.user._id : null;
    const finalUserId = jwtUserId || orgUserId;
    console.log("Hi")
    console.log(finalUserId,orgUserId,"UserID",jwtUserId)

    let assessmentType = null;

    // ✅ Prevent retake if already completed
    // if (assessmentId && finalUserId && organizationId) {
    //   const alreadyTaken = await AssessmentOutcome.findOne({
    //     assessmentId,
    //     $or: [{ userId: finalUserId }, { orgUserId }],
    //     organizationId,
    //   });

    //   if (alreadyTaken) {
    //     return res.status(409).json({
    //       error: "You have already attempted this assessment.",
    //       outcomeId: alreadyTaken._id,
    //     });
    //   }
    // }

    // ✅ Fetch the assessmentType
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (
        !assessment ||
        (assessment.validUntil && new Date(assessment.validUntil) < new Date())
      ) {
        return res.status(410).json({ error: "This assessment has expired." });
      }
      assessmentType = await AssessmentTypes.findById(assessment.type);
    }

    if (!assessmentType) {
      assessmentType = await AssessmentTypes.findOne({
        title: /Burnout Assessment/i,
        status: "active",
      });
    }

    if (!assessmentType) {
      return res.status(404).json({ error: "Assessment type not found" });
    }

    // ✅ Create the AssessmentOutcome even if warmup is empty
    const outcome = new AssessmentOutcome({
      userId: finalUserId || null,
      orgUserId: orgUserId || null,
      organizationId: organizationId || null,
      assessmentType: assessmentType._id,
      assessmentId: assessmentId || null,
    });

    await outcome.save();

    // ✅ Get questions by phase
    const questionsByPhase = [0, 1, 2].reduce((acc, phase) => {
      acc[`phase${phase}`] = assessmentType.questions.filter(
        (q) => q.phase === phase
      );
      return acc;
    }, {});
    // outcomeId: outcome._id,
    // outcomeId: outcome._id,


    return res.status(200).json({data:{
      ...questionsByPhase,
      phasesAvailable: Object.entries(questionsByPhase)
        .filter(([, questions]) => questions.length > 0)
        .map(([key]) => parseInt(key.replace("phase", ""))),
    },outcomeId: outcome._id});
  } catch (error) {
    console.error("Get Warmup Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};

exports.checkValidity = async (req, res) => {
  try {
    const { assessmentId, orgUserId, organizationId } = req.query;
    const jwtUserId = req.user ? req.user._id : null;
    const finalUserId = jwtUserId || orgUserId;

    if (!assessmentId) {
      return res.status(400).json({ error: "Assessment ID is required" });
    }

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Expiry Check
    if (assessment.validUntil && new Date(assessment.validUntil) < new Date()) {
      return res.status(410).json({
        error: "Assessment has expired",
        expiredOn: assessment.validUntil,
      });
    }

    // Retake Check
    if (finalUserId && organizationId) {
      const alreadyTaken = await AssessmentOutcome.findOne({
        assessmentId,
        $or: [{ userId: finalUserId }, { orgUserId }],
        organizationId,
      });

      if (alreadyTaken) {
        return res.status(409).json({
          error: "You have already attempted this assessment.",
          outcomeId: alreadyTaken._id,
        });
      }
    }

    // Valid
    return res.status(200).json({
      message: "Assessment is valid",
      validUntil: assessment.validUntil || null,
    });
  } catch (e) {
    console.error("Check Validity Error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Submit warmup and generate screening questions
exports.submitWarmup = async (req, res) => {
  try {
    const { warmupAnswers, organizationId, assessmentId, orgUserId, outcomeId } = req.body;
    console.log(outcomeId)
    const jwtUserId = req.user ? req.user._id : null;
    const finalUserId = jwtUserId || orgUserId;

    if (!finalUserId) {
      return res.status(400).json({ error: "User or OrgUser ID is required" });
    }

    if (!outcomeId) {
      return res.status(400).json({ error: "Outcome ID is required" });
    }

    const outcome = await AssessmentOutcome.findById(outcomeId);
    if (!outcome) {
      return res.status(404).json({ error: "Assessment outcome not found" });
    }

    // Update warmup responses
    outcome.warmupResponses = warmupAnswers;
    await outcome.save();

    let assessmentType = null;

    // Load assessmentType from linked assessmentId (if any)
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: "Linked assessment not found" });
      }
      assessmentType = await AssessmentTypes.findById(assessment.type);
    }

    // Fallback for default user flow
    if (!assessmentType && jwtUserId) {
      assessmentType = await AssessmentTypes.findOne({
        title: /Burnout Assessment/i,
        status: "active",
      });

      if (!assessmentType) {
        return res.status(404).json({ error: "Default assessment type not found" });
      }
    }

    // Filter screening questions (phase 1)
    const screeningQuestions = assessmentType.questions.filter(
      (q) => q.phase === 1
    );

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

    let assessmentType;

    if (outcome.assessmentType) {
      assessmentType = await AssessmentTypes.findById(outcome.assessmentType);
    } else if (outcome.assessmentId) {
      const assessment = await Assessment.findById(outcome.assessmentId);
      assessmentType = await AssessmentTypes.findById(assessment.type);
    }

    if (!assessmentType)
      return res.status(404).json({ error: "Assessment type not found" });

    const screeningQuestions = assessmentType.questions.filter(
      (q) => q.phase === 1
    );
    const flaggedDiseases = [];

    for (const disease of assessmentType.diseases) {
      const diseaseId = disease._id?.toString();
      const diseaseQuestions = screeningQuestions.filter(
        (q) => q.disease?.toString() === diseaseId
      );

      const matchedAnswers = screeningAnswers.filter((ans) =>
        diseaseQuestions.some(
          (q) =>
            q._id?.toString() === ans.questionId &&
            q.validOptions.includes(ans.answer)
        )
      );

      const validCount = matchedAnswers.length;

      // 🔍 DEBUG LOGS
      // console.log(`\n🧬 Disease: ${disease.diseaseName}`);
      // console.log(
      //   `➡️  Minimum Screening Required: ${disease.minimumScreening}`
      // );
      // console.log(`✅ Matched Valid Answers: ${validCount}`);
      // console.log(`📋 Matching Questions:`);

      matchedAnswers.forEach((ans) => {
        const question = diseaseQuestions.find(
          (q) => q._id?.toString() === ans.questionId
        );
        if (question) {
          // console.log(
          //   `  - Q: "${question.questionName}" | Answer: "${ans.answer}"`
          // );
        }
      });

      if (
        disease.allowedPhases?.includes(1) &&
        validCount >= disease.minimumScreening
      ) {
        flaggedDiseases.push(disease._id);
      } else if (!disease.allowedPhases?.includes(1)) {
        // If screening is disabled, treat as flagged automatically
        flaggedDiseases.push(disease._id);
      }
    }

    const severityQuestions = assessmentType.questions.filter(
      (q) =>
        q.phase === 2 &&
        flaggedDiseases.some((dId) => q.disease?.toString() === dId.toString())
    );

    if (severityQuestions.length === 0) {
      outcome.complete = true; // no further questions
    }

    await outcome.save();

    res.status(200).json({ severityQuestions });
  } catch (error) {
    console.error("Submit Screening Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Submit severity and return results
exports.submitSeverity = async (req, res) => {
  try {
    const { severityAnswers, outcomeId } = req.body;

    const outcome = await AssessmentOutcome.findById(outcomeId);
    if (!outcome) {
      return res.status(404).json({ error: "Outcome not found" });
    }

    outcome.severityResponses = severityAnswers;

    let assessmentType;

    if (outcome.assessmentType) {
      assessmentType = await AssessmentTypes.findById(outcome.assessmentType);
    } else if (outcome.assessmentId) {
      const assessment = await Assessment.findById(outcome.assessmentId);
      assessmentType = await AssessmentTypes.findById(assessment.type);
    }

    if (!assessmentType) {
      return res.status(404).json({ error: "Assessment type not found" });
    }

    // Step 1: Identify diseases that had severity questions answered
    const answeredDiseaseIds = assessmentType.questions
      .filter(
        (q) =>
          q.phase === 2 &&
          severityAnswers.some((ans) => ans.questionId === q._id.toString())
      )
      .map((q) => q.disease?.toString())
      .filter(Boolean); // Remove nulls in case of orphan questions

    const uniqueDiseaseIds = [...new Set(answeredDiseaseIds)];

    const results = [];

    // Step 2: Evaluate severity for each relevant disease
    for (const diseaseId of uniqueDiseaseIds) {
      const diseaseData = assessmentType.diseases.find(
        (d) => d._id?.toString() === diseaseId
      );

      if (!diseaseData) continue;

      const { mild = 1, moderate = 2, severe = 3 } =
        diseaseData.minimumSeverity || {};

      const relevantQuestions = assessmentType.questions.filter(
        (q) => q.phase === 2 && q.disease?.toString() === diseaseId
      );

      const severityCount = severityAnswers.reduce((count, ans) => {
        const question = relevantQuestions.find(
          (q) => q._id?.toString() === ans.questionId
        );
        if (question && question.validOptions.includes(ans.answer)) {
          return count + 1;
        }
        return count;
      }, 0);

      // ⚠️ Skip if below mild threshold
      if (severityCount < mild) continue;

      // Step 3: Determine severity level
      let severityLevel = "Mild";
      if (severityCount >= severe) severityLevel = "Severe";
      else if (severityCount >= moderate) severityLevel = "Moderate";

      const reportText =
        diseaseData.reportText?.[severityLevel.toLowerCase()] || {};
      const parameter =
        diseaseData.assessmentParameter || diseaseData.diseaseName;

      results.push({
        disease: diseaseData.diseaseName,
        severity: severityLevel,
        assessmentParameter: parameter,
        reportText: {
          whatItMeans: reportText.whatItMeans || "",
          howItFeels: reportText.howItFeels || "",
          whatCanHelp: reportText.whatCanHelp || "",
        },
      });
    }

    // Step 4: Finalize outcome
    outcome.results = results;
    outcome.complete = true;
    await outcome.save();

    // Step 5: Add outcome to user's assessments if it's a JWT user
    if (outcome.userId) {
      await User.findByIdAndUpdate(outcome.userId, {
        $push: { assessment: outcome._id },
      });
    }

    // Step 6: Increment usage count
    if (outcome.assessmentType) {
      await AssessmentTypes.findByIdAndUpdate(outcome.assessmentType, {
        $inc: { completedCount: 1 },
      });
    }

    res.status(200).json({
      message: "Assessment completed",
      outcomeId: outcome._id,
      results,
    });
  } catch (error) {
    console.error("Submit Severity Error:", error);
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

exports.deleteOutcomeByOrgUser = async (req, res) => {
  try {
    const { orgUserId } = req.params;

    if (!orgUserId)
      return res.status(400).json({ error: "orgUserId is required" });

    const deleted = await AssessmentOutcome.deleteMany({ orgUserId });
    // console.log(deleted);

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "No outcome found for this orgUserId" });
    }

    res
      .status(200)
      .json({ message: "Assessment outcome deleted", outcomeId: deleted._id });
  } catch (err) {
    console.error("Delete Outcome Error:", err.message);
    res.status(500).json({ error: "Server error while deleting outcome" });
  }
};
