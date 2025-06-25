// backend/routes/tasks.js
const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// GET /api/tasks/ - Get all tasks for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks." });
  }
});

// POST /api/tasks/ - Create a new task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { text, date } = req.body;
    if (!text || !date)
      return res.status(400).json({ message: "Text and date are required." });

    const newTask = new Task({
      userId: req.user.id,
      text,
      date,
      completed: false,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ message: "Error creating task." });
  }
});

// PATCH /api/tasks/:id - Update task (text, completed)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (req.body.text !== undefined) task.text = req.body.text;
    if (req.body.completed !== undefined) task.completed = req.body.completed;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Error updating task." });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task." });
  }
});

module.exports = router;
