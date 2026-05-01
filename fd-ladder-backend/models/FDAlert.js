const mongoose = require("mongoose");

const fdAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bankName: { type: String, required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    startDate: { type: Date, required: true },
    maturityDate: { type: Date, required: true },
    alertDaysBefore: { type: Number, default: 7 }, // alert 7 days before maturity
    email: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastAlertSent: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FDAlert", fdAlertSchema);