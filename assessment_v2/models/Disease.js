// models/Disease.js
const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema({
  diseaseName: { type: String, required: true, unique: true },
  minimumScreening: { type: Number, required: true }, // Minimum screening questions to flag
  minimumSeverity: {
    mild: { type: Number, required: true },
    moderate: { type: Number, required: true },
    severe: { type: Number, required: true },
  },
  diseaseSeverity: {
    type: String,
    enum: ["Alarming", "Moderate", "Less Alarming"],
    required: true,
  },
});

module.exports = mongoose.model("Disease", DiseaseSchema);