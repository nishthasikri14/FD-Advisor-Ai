const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Simple Alert schema (inline — no separate model file needed)
const alertSchema = new mongoose.Schema({
  amount: Number,
  bank: String,
  maturityDate: String,
  email: String,
}, { timestamps: true });

const Alert = mongoose.models.Alert || mongoose.model("Alert", alertSchema);

// GET /api/alerts
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ maturityDate: 1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/alerts
router.post("/", async (req, res) => {
  try {
    const { amount, bank, maturityDate, email } = req.body;
    if (!amount || !bank || !maturityDate || !email)
      return res.status(400).json({ message: "All fields required" });
    const alert = await Alert.create({ amount, bank, maturityDate, email });
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete("/:id", async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;