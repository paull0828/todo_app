const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 5000;

// === CORS Setup ===
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://todo-app-drab-six-17.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

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
