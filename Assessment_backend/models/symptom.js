const mongoose = require("mongoose");

const SymptomSchema = new mongoose.Schema({
  symptomKey: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  // Optionally, you can store references to diseases (if needed)
  diseases: [{ type: String }],
});

module.exports = mongoose.model("Symptom", SymptomSchema);
