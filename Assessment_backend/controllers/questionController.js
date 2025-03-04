const Question = require("../models/question");
const Symptom = require("../models/symptom");
const mongoose = require("mongoose");

exports.createQuestion = async (req, res) => {
  try {
    const { questionKey, text, symptom, disease } = req.body;
    let symptomId, diseaseId;

    // Convert symptom name to ObjectID
    if (mongoose.Types.ObjectId.isValid(symptom)) {
      symptomId = symptom;
    } else {
      const foundSymptom = await Symptom.findOne({
        name: { $regex: `^${symptom}$`, $options: "i" },
      });
      if (!foundSymptom) {
        throw new Error(`Symptom not found for name: ${symptom}`);
      }
      symptomId = foundSymptom._id;
    }

    // Convert disease name to ObjectID
    if (mongoose.Types.ObjectId.isValid(disease)) {
      diseaseId = disease;
    } else {
      const foundDisease = await Disease.findOne({
        name: { $regex: `^${disease}$`, $options: "i" },
      });
      if (!foundDisease) {
        throw new Error(`Disease not found for name: ${disease}`);
      }
      diseaseId = foundDisease._id;
    }

    const newQuestion = new Question({
      questionKey,
      text,
      symptom: symptomId,
      disease: diseaseId,
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getQuestions = async (req, res) => {
  try {
    const symptoms = await Symptom.find();
    const randomQuestions = await Promise.all(
      symptoms.map(async (symptom) => {
        const questions = await Question.find({ symptom: symptom._id });
        if (questions.length > 0) {
          const shuffled = questions.sort(() => 0.5 - Math.random()); // Shuffle array
          return shuffled.slice(0, Math.min(2, questions.length)); // Pick up to 2 random questions
        }
        return [];
      })
    );

    // Flatten the array and remove empty sets
    res.status(200).json(randomQuestions.flat().filter(q => q !== null));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.bulkUploadQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide an array of questions." });
    }

    // Process each question: Convert "symptom" and "disease" fields to ObjectIDs
    const processedQuestions = await Promise.all(
      questions.map(async (q) => {
        let symptomId, diseaseId;

        // Convert symptom name to ObjectID
        if (mongoose.Types.ObjectId.isValid(q.symptom)) {
          symptomId = q.symptom;
        } else {
          const foundSymptom = await Symptom.findOne({
            name: { $regex: `^${q.symptom}$`, $options: "i" },
          });
          if (!foundSymptom) {
            throw new Error(`Symptom not found for name: ${q.symptom}`);
          }
          symptomId = foundSymptom._id;
        }

        // Convert disease name to ObjectID
        if (mongoose.Types.ObjectId.isValid(q.disease)) {
          diseaseId = q.disease;
        } else {
          const foundDisease = await Disease.findOne({
            name: { $regex: `^${q.disease}$`, $options: "i" },
          });
          if (!foundDisease) {
            throw new Error(`Disease not found for name: ${q.disease}`);
          }
          diseaseId = foundDisease._id;
        }

        return {
          questionKey: q.questionKey,
          text: q.text,
          symptom: symptomId,
          disease: diseaseId,
        };
      })
    );

    // Insert processed questions into database
    const createdQuestions = await Question.insertMany(processedQuestions);
    res.status(201).json({
      message: "Bulk upload successful",
      data: createdQuestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
