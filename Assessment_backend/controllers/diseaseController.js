const Disease = require("../models/disease");
const Symptom = require("../models/symptom");
const mongoose = require("mongoose");

exports.createDisease = async (req, res) => {
  try {
    const { diseaseKey, name, symptoms } = req.body;

    // Convert each symptom value (ID or name) into an ObjectID.
    const symptomIds = await Promise.all(
      (symptoms || []).map(async (symptom) => {
        if (mongoose.Types.ObjectId.isValid(symptom)) {
          return symptom; // already an ObjectID
        } else {
          // Look up symptom by name (case-insensitive)
          const foundSymptom = await Symptom.findOne({
            name: { $regex: `^${symptom}$`, $options: "i" },
          });
          if (!foundSymptom) {
            throw new Error(`Symptom not found for name: ${symptom}`);
          }
          return foundSymptom._id;
        }
      })
    );

    const newDisease = new Disease({ diseaseKey, name, symptoms: symptomIds });
    await newDisease.save();
    res.status(201).json(newDisease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.createDiseasesBulk = async (req, res) => {
  try {
    const diseases = req.body.diseases;
    if (!Array.isArray(diseases) || diseases.length === 0) {
      return res.status(400).json({ error: "Invalid input. Expecting an array of diseases." });
    }

    const processedDiseases = await Promise.all(
      diseases.map(async ({ diseaseKey, name, symptoms }) => {
        const symptomIds = await Promise.all(
          (symptoms || []).map(async (symptom) => {
            if (mongoose.Types.ObjectId.isValid(symptom)) {
              return symptom;
            } else {
              const foundSymptom = await Symptom.findOne({
                name: { $regex: `^${symptom}$`, $options: "i" },
              });
              if (!foundSymptom) {
                throw new Error(`Symptom not found for name: ${symptom}`);
              }
              return foundSymptom._id;
            }
          })
        );
        return { diseaseKey, name, symptoms: symptomIds };
      })
    );

    const newDiseases = await Disease.insertMany(processedDiseases);
    res.status(201).json(newDiseases);
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



exports.getDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find().populate("symptoms");
    res.status(200).json(diseases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDisease = async (req, res) => {
  try {
    const { id } = req.params;
    const disease = await Disease.findByIdAndDelete(id);
    if (!disease) {
      return res.status(404).json({ error: "Disease not found" });
    }
    res.status(200).json({ message: "Disease deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
