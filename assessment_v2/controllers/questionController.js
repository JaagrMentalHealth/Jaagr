// controllers/questionController.js
const Question = require("../models/Question");

// Create Question
exports.createQuestion = async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Bulk Upload Questions
const Question = require('../models/Question');
const Disease = require('../models/Disease');

exports.bulkUploadQuestions = async (req, res) => {
  try {
    const incomingQuestions = req.body;

    const diseases = await Disease.find({}, 'diseaseName _id');
    const diseaseMap = {};
    diseases.forEach(d => {
      diseaseMap[d.diseaseName.toLowerCase()] = d._id;
    });

    const preparedQuestions = incomingQuestions.map(q => {
      const diseaseName = q.disease?.toLowerCase();
      const diseaseId = diseaseMap[diseaseName] || null;

      return {
        questionName: q.questionName,
        optionType: q.optionType,
        options: q.options,
        validOptions: q.validOptions,
        disease: diseaseId, // can be null for warmup questions
        phase: q.phase,
      };
    });

    const questions = await Question.insertMany(preparedQuestions);
    res.status(201).json(questions);
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    res.status(400).json({ error: error.message });
  }
};


// Other CRUD operations (get, update, delete) can be added similarly.