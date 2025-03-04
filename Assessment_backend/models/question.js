const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionKey: { type: String, unique: true, required: true },
  text: { type: String, required: true },
  symptom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Symptom",
    required: true,
  },
  disease:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Disease",
    required: true,
  },
  phase: {type: String,default: "1"}

});

module.exports = mongoose.model("Question", QuestionSchema);
