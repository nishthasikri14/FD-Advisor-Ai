const express = require("express");
const router = express.Router();
const Bank = require("../models/Bank");

// GET /api/banks — get all active banks with rates
router.get("/", async (req, res) => {
  try {
    const banks = await Bank.find({ isActive: true }).sort({ name: 1 });
    res.json(banks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/banks/best?tenure=2 — get best rate for a tenure
router.get("/best", async (req, res) => {
  try {
    const { tenure } = req.query;
    if (!tenure) return res.status(400).json({ message: "Provide tenure param" });

    const banks = await Bank.find({ isActive: true });
    const sorted = banks
      .filter((b) => b.rates && b.rates[tenure])
      .sort((a, b) => b.rates[tenure] - a.rates[tenure]);

    res.json(sorted.slice(0, 5));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/banks/seed — seed sample bank data (run once)
router.post("/seed", async (req, res) => {
  try {
    await Bank.deleteMany({});
    const banks = [
      { name: "State Bank of India", shortName: "SBI", rates: { 1: 6.8, 2: 7.0, 3: 6.75, 5: 6.5, 7: 6.5 }, safetyRating: "AAA" },
      { name: "HDFC Bank", shortName: "HDFC", rates: { 1: 7.1, 2: 7.2, 3: 7.25, 5: 7.0, 7: 7.0 }, safetyRating: "AAA" },
      { name: "ICICI Bank", shortName: "ICICI", rates: { 1: 7.2, 2: 7.25, 3: 7.3, 5: 7.1, 7: 7.1 }, safetyRating: "AAA" },
      { name: "Axis Bank", shortName: "Axis", rates: { 1: 6.9, 2: 7.1, 3: 7.1, 5: 7.0, 7: 7.0 }, safetyRating: "AA+" },
      { name: "Kotak Mahindra Bank", shortName: "Kotak", rates: { 1: 7.1, 2: 7.15, 3: 7.2, 5: 6.9, 7: 6.9 }, safetyRating: "AA+" },
      { name: "Yes Bank", shortName: "Yes", rates: { 1: 7.5, 2: 7.75, 3: 7.75, 5: 7.5, 7: 7.5 }, safetyRating: "AA-" },
      { name: "IndusInd Bank", shortName: "IndusInd", rates: { 1: 7.75, 2: 7.9, 3: 7.9, 5: 7.75, 7: 7.75 }, safetyRating: "AA" },
      { name: "Punjab National Bank", shortName: "PNB", rates: { 1: 6.5, 2: 6.8, 3: 6.5, 5: 6.5, 7: 6.5 }, safetyRating: "AA+" },
    ];
    await Bank.insertMany(banks);
    res.json({ message: "Banks seeded successfully", count: banks.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 