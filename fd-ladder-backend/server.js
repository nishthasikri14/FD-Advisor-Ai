const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
require("./utils/alertScheduler");
require("./utils/alertCron"); // ✅ start cron
const alertRoutes = require("./routes/alerts");
const ladderRoutes = require("./routes/ladder");
const userRoutes = require("./routes/user");
const bankRoutes = require("./routes/bank");
const aiRoutes = require("./routes/ai");
const { startAlertCron } = require("./utils/alertCron");
const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/ladder", ladderRoutes);
app.use("/api/user", userRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/alerts", alertRoutes);
// Health check
app.get("/", (req, res) => res.json({ status: "FD Ladder API running" }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    startAlertCron(); // ✅ ADD THIS
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("MongoDB error:", err));