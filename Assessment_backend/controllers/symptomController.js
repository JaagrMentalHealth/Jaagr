const Symptom = require("../models/symptom");
const Disease = require("../models/disease");
const mongoose = require("mongoose");

exports.createSymptom = async (req, res) => {
  try {
    const { symptomKey, name, diseases } = req.body;
    const newSymptom = new Symptom({ symptomKey, name, diseases });
    await newSymptom.save();
    res.status(201).json(newSymptom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSymptomsBulk = async (req, res) => {
  try {
    const symptoms = req.body.symptoms;
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: "Invalid input. Expecting an array of symptoms." });
    }
    const newSymptoms = await Symptom.insertMany(symptoms);
    res.status(201).json(newSymptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getSymptoms = async (req, res) => {
  try {
    const symptoms = await Symptom.find().populate("diseases");
    res.status(200).json(symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSymptom = async (req, res) => {
  try {
    const { id } = req.params;
    const symptom = await Symptom.findByIdAndDelete(id);
    if (!symptom) {
      return res.status(404).json({ error: "Symptom not found" });
    }
    res.status(200).json({ message: "Symptom deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
