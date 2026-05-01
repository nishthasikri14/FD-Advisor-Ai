const express = require("express");
const router = express.Router();

// POST /api/ai/chat  (existing - untouched)
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert Indian financial advisor specializing in Fixed Deposits (FDs). 
You help users understand FD laddering strategies, tax implications, bank comparisons, and investment planning.
Keep responses concise, practical, and relevant to Indian banking (RBI regulations, Indian tax laws like Section 80C, TDS on FDs).
Use ₹ symbol for amounts. Be friendly and helpful.

User question: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({ message: "Gemini API error", detail: data });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not generate a response.";
    res.json({ reply });
  } catch (err) {
    console.error("AI route error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/advisor  (NEW - grounded AI for FD Ladder Builder)
router.post("/advisor", async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\nUser: ${message}`
      : message;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini advisor error:", data);
      return res.status(500).json({ message: "Gemini API error", detail: data });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not generate a response.";
    res.json({ reply });
  } catch (err) {
    console.error("AI advisor route error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;