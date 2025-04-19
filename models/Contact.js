const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    referenceId: {
      type: Number,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Auto‐generate a 6‑digit numeric referenceId before saving
contactSchema.pre("validate", async function (next) {
  if (this.isNew) {
    // Simple random 6‑digit ref. In production you might use a sequence counter.
    this.referenceId = Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
