const mongoose = require("mongoose");

const rungSchema = new mongoose.Schema({
  tenure: Number,
  principal: Number,
  rate: Number,
  maturity: Number,
  interest: Number,
  taxAmt: Number,
  netReturn: Number,
});

const strategySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    taxBracket: { type: Number, required: true },
    liquidity: { type: String, enum: ["yearly", "every2", "flexible"], required: true },
    duration: { type: Number, required: true },
    rungs: [rungSchema],
    totalMaturity: Number,
    totalNet: Number,
    totalTax: Number,
    singleFDNet: Number,
    shareToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Strategy", strategySchema);