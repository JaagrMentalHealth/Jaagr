const Question = require('../models/question');
const Disease = require('../models/disease');

/**
 * POST /api/diagnose
 * Request Body Example:
 * [
 *   { "questionId": "62a...", "answerPercentage": 75 },
 *   { "questionId": "62b...", "answerPercentage": 50 },
 *   ...
 * ]
 */
const getPhase2Questions = async (diseaseIds, existingQuestionIds) => {
  try {
    const phase2Questions = await Promise.all(
      diseaseIds.map(async (diseaseId) => {
        const questions = await Question.find({
          disease: diseaseId,
          _id: { $nin: existingQuestionIds }, // Exclude Phase 1 questions
        });

        if (questions.length > 0) {
          const shuffled = questions.sort(() => 0.5 - Math.random()); // Shuffle for randomness
          return shuffled.slice(0, Math.min(5, questions.length)); // Pick up to 5 unique questions per disease
        }
        return [];
      })
    );

    return phase2Questions.flat().filter(q => q !== null);
  } catch (err) {
    throw new Error("Error fetching Phase 2 questions: " + err.message);
  }
};

exports.diagnose = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Answers must be provided as a non-empty array" });
    }

    for (const ans of answers) {
      if (
        typeof ans.answerPercentage !== "number" ||
        ans.answerPercentage < 0 ||
        ans.answerPercentage > 100
      ) {
        return res.status(400).json({ error: "Each answerPercentage must be a number between 0 and 100" });
      }
    }

    // Aggregate answers by symptom
    const symptomScores = {};

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (!question) {
        return res.status(404).json({ error: `Question not found with id: ${ans.questionId}` });
      }
      const symptomId = question.symptom.toString();

      if (symptomScores[symptomId]) {
        symptomScores[symptomId].total += ans.answerPercentage;
        symptomScores[symptomId].count += 1;
      } else {
        symptomScores[symptomId] = { total: ans.answerPercentage, count: 1 };
      }
    }

    // Compute average probability for each symptom
    const symptomProbabilities = {};
    for (const [symptomId, data] of Object.entries(symptomScores)) {
      symptomProbabilities[symptomId] = data.total / data.count;
    }

    // Retrieve diseases and compute probabilities
    const diseases = await Disease.find().populate("symptoms");
    const diseaseProbabilities = [];

    diseases.forEach((disease) => {
      let total = 0;
      disease.symptoms.forEach((symptom) => {
        const score = symptomProbabilities[symptom._id.toString()] || 0;
        total += score;
      });

      const avgProbability = total / disease.symptoms.length;
      diseaseProbabilities.push({
        diseaseId: disease._id,
        diseaseKey: disease.diseaseKey,
        name: disease.name,
        probability: avgProbability,
      });
    });

    // Sort diseases by highest probability
    diseaseProbabilities.sort((a, b) => b.probability - a.probability);

    // Identify top 3 diseases for Phase 2
    const topDiseases = diseaseProbabilities.slice(0, 3).map(d => d.diseaseId);

    // Get Phase 2 questions
    const existingQuestionIds = answers.map(ans => ans.questionId);
    const phase2Questions = await getPhase2Questions(topDiseases, existingQuestionIds);

    res.status(200).json({
      diagnosis: diseaseProbabilities,
      phase2Questions: phase2Questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};











//Phase 2 Diagnosis

exports.diagnosePhase2 = async (req, res) => {
  try {
    const { answers, phase1Diagnosis } = req.body; // Include phase1 diagnosis

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Answers must be provided as a non-empty array" });
    }

    if (!Array.isArray(phase1Diagnosis) || phase1Diagnosis.length === 0) {
      return res.status(400).json({ error: "Phase 1 diagnosis data is required." });
    }

    // Validate answer percentages
    for (const ans of answers) {
      if (
        typeof ans.answerPercentage !== "number" ||
        ans.answerPercentage < 0 ||
        ans.answerPercentage > 100
      ) {
        return res.status(400).json({ error: "Each answerPercentage must be a number between 0 and 100" });
      }
    }

    // Aggregate answers by disease
    const diseaseScores = {};

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (!question) {
        return res.status(404).json({ error: `Question not found with id: ${ans.questionId}` });
      }
      const diseaseId = question.disease.toString();

      if (diseaseScores[diseaseId]) {
        diseaseScores[diseaseId].total += ans.answerPercentage;
        diseaseScores[diseaseId].count += 1;
      } else {
        diseaseScores[diseaseId] = { total: ans.answerPercentage, count: 1 };
      }
    }

    // Compute phase 2 probability for each disease
    const diseaseProbabilities = [];
    for (const [diseaseId, data] of Object.entries(diseaseScores)) {
      const avgProbability = data.total / data.count;
      const disease = await Disease.findById(diseaseId);

      diseaseProbabilities.push({
        diseaseId: disease._id,
        diseaseKey: disease.diseaseKey,
        name: disease.name,
        probabilityPhase2: avgProbability, // Store phase 2 probability
      });
    }

    // Merge phase 1 and phase 2 probabilities
    const finalDiagnosis = diseaseProbabilities.map((phase2Disease) => {
      const phase1Disease = phase1Diagnosis.find(
        (d) => d.diseaseId === phase2Disease.diseaseId
      );

      const probabilityPhase1 = phase1Disease ? phase1Disease.probability : 0;
      const probabilityPhase2 = phase2Disease.probabilityPhase2;

      // Compute severity percentage
      const severity = (probabilityPhase1 + probabilityPhase2) / 2;

      return {
        diseaseId: phase2Disease.diseaseId,
        diseaseKey: phase2Disease.diseaseKey,
        name: phase2Disease.name,
        probabilityPhase1,
        probabilityPhase2,
        severity, // Final severity score
      };
    });

    // Sort by severity
    finalDiagnosis.sort((a, b) => b.severity - a.severity);
    const mostProbableDisease = finalDiagnosis[0];

    res.status(200).json({
      finalDiagnosis: mostProbableDisease,
      allDiagnosis: finalDiagnosis, // Optional: full severity breakdown
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


