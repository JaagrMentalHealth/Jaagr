const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema({
  diseaseKey: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  // Array of references to symptoms
  symptoms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Symptom" }],
});

module.exports = mongoose.model("Disease", DiseaseSchema);
