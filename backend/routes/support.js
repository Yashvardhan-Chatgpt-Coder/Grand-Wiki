const express = require("express");
const SupportSubmission = require("../models/SupportSubmission");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body.name || req.user?.name || "").trim();
    const email = String(req.body.email || req.user?.email || "").trim().toLowerCase();
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Name, email, subject, and message are required." });
    }

    if (!["Suggestion", "Bug Report"].includes(subject)) {
      return res.status(400).json({ message: "Invalid subject." });
    }

    const support = await SupportSubmission.create({
      userId: req.user?._id || null,
      name,
      email,
      subject,
      message,
      status: "New",
    });

    res.status(201).json(support.toObject());
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const support = await SupportSubmission.find().sort({ createdAt: -1 }).lean();
    res.json(support);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
