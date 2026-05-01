const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Strategy = require("../models/Strategy");
const { protect } = require("../middleware/auth");
const { calculateLadder } = require("../utils/ladderCalc");

// POST /api/ladder/calculate — public, no login needed
router.post("/calculate", async (req, res) => {
  try {
    const { amount, taxBracket, liquidity, duration } = req.body;

    if (!amount || !taxBracket === undefined || !liquidity || !duration) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const result = calculateLadder({ amount, taxBracket, liquidity, duration });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ladder/save — protected, must be logged in
router.post("/save", protect, async (req, res) => {
  try {
    const { amount, taxBracket, liquidity, duration } = req.body;

    const result = calculateLadder({ amount, taxBracket, liquidity, duration });

    const strategy = await Strategy.create({
      user: req.user._id,
      amount,
      taxBracket,
      liquidity,
      duration,
      ...result,
    });

    // Add to user's saved strategies
    await require("../models/User").findByIdAndUpdate(req.user._id, {
      $push: { savedStrategies: strategy._id },
    });

    res.status(201).json(strategy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ladder/history — get all saved strategies for logged-in user
router.get("/history", protect, async (req, res) => {
  try {
    const strategies = await Strategy.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(strategies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ladder/:id/share — generate a shareable link token
router.post("/:id/share", protect, async (req, res) => {
  try {
    const strategy = await Strategy.findOne({ _id: req.params.id, user: req.user._id });
    if (!strategy) return res.status(404).json({ message: "Strategy not found" });

    if (!strategy.shareToken) {
      strategy.shareToken = crypto.randomBytes(16).toString("hex");
      await strategy.save();
    }

    res.json({ shareToken: strategy.shareToken, shareUrl: `/api/ladder/shared/${strategy.shareToken}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ladder/shared/:token — view a shared strategy (public)
router.get("/shared/:token", async (req, res) => {
  try {
    const strategy = await Strategy.findOne({ shareToken: req.params.token }).select("-user");
    if (!strategy) return res.status(404).json({ message: "Shared strategy not found" });
    res.json(strategy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/ladder/:id — delete a saved strategy
router.delete("/:id", protect, async (req, res) => {
  try {
    const strategy = await Strategy.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!strategy) return res.status(404).json({ message: "Strategy not found" });
    res.json({ message: "Strategy deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
console.log("ladder.js exporting:", typeof router);
module.exports = router;