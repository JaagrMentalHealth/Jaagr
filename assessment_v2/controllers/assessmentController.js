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
    let assessmentType = null;

    if (orgUserId && organizationId && assessmentId) {
      const alreadyTaken = await AssessmentOutcome.findOne({
        orgUserId,
        organizationId,
        assessmentId,
      });

      if (alreadyTaken) {
        return res.status(409).json({
          error: "You have already attempted this assessment.",
          outcomeId: alreadyTaken._id,
        });
      }
    }

    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment || (assessment.validUntil && new Date(assessment.validUntil) < new Date())) {
        return res.status(410).json({ error: "This assessment has expired." });
      }
      assessmentType = await AssessmentTypes.findById(assessment.type);
    }

    if (!assessmentType) {
      assessmentType = await AssessmentTypes.findOne({
        title: /Emotional Wellbeing V1/i,
        status: "active",
      });
    }

    if (!assessmentType) {
      return res.status(404).json({ error: "Assessment type not found" });
    }

    const questionsByPhase = [0, 1, 2].reduce((acc, phase) => {
      acc[`phase${phase}`] = assessmentType.questions.filter(q => q.phase === phase);
      return acc;
    }, {});

    return res.status(200).json({
      ...questionsByPhase,
      phasesAvailable: Object.entries(questionsByPhase)
        .filter(([, questions]) => questions.length > 0)
        .map(([key]) => parseInt(key.replace('phase', ''))),
    });
  } catch (error) {
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

      assessmentType = await AssessmentTypes.findById(assessment.type)

      if (!assessmentType) {
        return res.status(404).json({ error: "Assessment type not found in admin setup" });
      }
    }

    // 🔹 General user flow (default assessment type)
    if (!assessmentType && jwtUserId) {
      assessmentType = await AssessmentTypes.findOne({ title: /Emotional Wellbeing V1/i, status: "active" })
      console.log(assessmentType)
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

    let assessmentType;

    if (outcome.assessmentType) {
      assessmentType = await AssessmentTypes.findById(outcome.assessmentType);
    } else if (outcome.assessmentId) {
      const assessment = await Assessment.findById(outcome.assessmentId);
      assessmentType = await AssessmentTypes.findById(assessment.type);
    }

    if (!assessmentType) return res.status(404).json({ error: "Assessment type not found" });

    const screeningQuestions = assessmentType.questions.filter(q => q.phase === 1);
    const flaggedDiseases = [];

    for (const disease of assessmentType.diseases) {
      const diseaseId = disease._id?.toString();
      const diseaseQuestions = screeningQuestions.filter(
        q => q.disease?.toString() === diseaseId
      );

      const matchedAnswers = screeningAnswers.filter(ans =>
        diseaseQuestions.some(q =>
          q._id?.toString() === ans.questionId && q.validOptions.includes(ans.answer)
        )
      );

      const validCount = matchedAnswers.length;

      // 🔍 DEBUG LOGS
      console.log(`\n🧬 Disease: ${disease.diseaseName}`);
      console.log(`➡️  Minimum Screening Required: ${disease.minimumScreening}`);
      console.log(`✅ Matched Valid Answers: ${validCount}`);
      console.log(`📋 Matching Questions:`);

      matchedAnswers.forEach(ans => {
        const question = diseaseQuestions.find(q => q._id?.toString() === ans.questionId);
        if (question) {
          console.log(`  - Q: "${question.questionName}" | Answer: "${ans.answer}"`);
        }
      });

      if (validCount >= disease.minimumScreening) {
        console.log(`🔓 Result: ✅ SCREENED IN`);
        flaggedDiseases.push(disease._id);
      } else {
        console.log(`🔒 Result: ❌ NOT SCREENED`);
      }
    }

    const severityQuestions = assessmentType.questions.filter(
      q => q.phase === 2 &&
        flaggedDiseases.some(dId => q.disease?.toString() === dId.toString())
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
    if (!outcome) return res.status(404).json({ error: "Outcome not found" });

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

    // Step 1: Identify diseases whose severity questions were rendered (i.e., answered)
    const answeredDiseaseIds = assessmentType.questions
      .filter(q =>
        q.phase === 2 &&
        severityAnswers.some(ans => ans.questionId === q._id.toString())
      )
      .map(q => q.disease?.toString());

    const uniqueDiseaseIds = [...new Set(answeredDiseaseIds)];

    const results = [];

    // Step 2: Evaluate only flagged diseases
    for (const disease of assessmentType.diseases) {
      const diseaseId = disease._id?.toString();
      if (!uniqueDiseaseIds.includes(diseaseId)) continue; // ❌ Skip unrendered diseases

      const criteria = assessmentType.scoringCriteria.find(
        c => c.diseaseId?.toString() === diseaseId
      ) || {};

      const moderateThreshold = criteria.moderate ?? 2;
      const severeThreshold = criteria.severe ?? 4;

      const relevantQuestions = assessmentType.questions.filter(
        q => q.phase === 2 && q.disease?.toString() === diseaseId
      );

      // Step 3: Count how many severity answers match valid severity options
      const severityCount = severityAnswers.reduce((count, ans) => {
        const question = relevantQuestions.find(q => q._id?.toString() === ans.questionId);
        if (question && question.validOptions.includes(ans.answer)) {
          return count + 1;
        }
        return count;
      }, 0);

      // Step 4: Classify severity level
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

    // Step 5: Finalize outcome
    outcome.results = results;
    outcome.complete = true;
    await outcome.save();

    // Step 6: Increment usage stats
    if (outcome.assessmentType) {
      await AssessmentTypes.findByIdAndUpdate(
        outcome.assessmentType,
        { $inc: { completedCount: 1 } }
      );
    }

    res.status(200).json({
      message: "Assessment completed",
      outcomeId: outcome._id,
      results
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

    if (!orgUserId) return res.status(400).json({ error: "orgUserId is required" });

    const deleted = await AssessmentOutcome.deleteMany({ orgUserId });
    console.log(deleted)

    if (!deleted) {
      return res.status(404).json({ error: "No outcome found for this orgUserId" });
    }

    res.status(200).json({ message: "Assessment outcome deleted", outcomeId: deleted._id });
  } catch (err) {
    console.error("Delete Outcome Error:", err.message);
    res.status(500).json({ error: "Server error while deleting outcome" });
  }
};
