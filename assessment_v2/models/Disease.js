const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema({
  diseaseName: { type: String, required: true, unique: true },
  assessmentParameter: { type: String, required: true },
  minimumScreening: { type: Number, required: true },
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
  reportText: {
    mild: { whatItMeans: String, howItFeels: String, whatCanHelp: String },
    moderate: { whatItMeans: String, howItFeels: String, whatCanHelp: String },
    severe: { whatItMeans: String, howItFeels: String, whatCanHelp: String },
  },
  allowedPhases: {
    type: [Number],
    enum: [0, 1, 2],
    default: [1, 2],
    required: true,
  },
});

module.exports = mongoose.model("Disease", DiseaseSchema);
