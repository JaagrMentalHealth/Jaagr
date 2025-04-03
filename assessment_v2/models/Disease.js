const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema({
  diseaseName: { type: String, required: true, unique: true }, // Clinical term
  assessmentParameter: { type: String, required: true }, // Friendly label for reports
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
    mild: {
      whatItMeans: { type: String },
      howItFeels: { type: String },
      whatCanHelp: { type: String },
    },
    moderate: {
      whatItMeans: { type: String },
      howItFeels: { type: String },
      whatCanHelp: { type: String },
    },
    severe: {
      whatItMeans: { type: String },
      howItFeels: { type: String },
      whatCanHelp: { type: String },
    },
  },
});

module.exports = mongoose.model("Disease", DiseaseSchema);
