const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 5000;

// === CORS Setup ===
app.use(cors());

// === Middleware ===
app.use(express.json());

// === Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// === Connect DB & Start Server ===
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
