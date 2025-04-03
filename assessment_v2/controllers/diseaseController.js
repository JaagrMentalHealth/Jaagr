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
exports.getAllDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find();
    res.status(200).json(diseases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDiseaseById = async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ error: "Disease not found" });
    }
    res.status(200).json(disease);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a disease by ID
exports.updateDisease = async (req, res) => {
  try {
    const updated = await Disease.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: "Disease not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a disease by ID
exports.deleteDisease = async (req, res) => {
  try {
    const deleted = await Disease.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Disease not found" });
    }
    res.status(200).json({ message: "Disease deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};