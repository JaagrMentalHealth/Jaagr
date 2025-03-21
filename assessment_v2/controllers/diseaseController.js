// controllers/diseaseController.js
const Disease = require("../models/Disease");

// Create Disease
exports.createDisease = async (req, res) => {
  try {
    const disease = new Disease(req.body);
    await disease.save();
    res.status(201).json(disease);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Bulk Upload Diseases
exports.bulkUploadDiseases = async (req, res) => {
  try {
    const diseases = await Disease.insertMany(req.body);
    res.status(201).json(diseases);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Other CRUD operations (get, update, delete) can be added similarly.