const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    rates: {
      1: Number,
      2: Number,
      3: Number,
      5: Number,
      7: Number,
    },
    safetyRating: { type: String, enum: ["AAA", "AA+", "AA", "AA-", "A+"], default: "AA" },
    minDeposit: { type: Number, default: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bank", bankSchema);