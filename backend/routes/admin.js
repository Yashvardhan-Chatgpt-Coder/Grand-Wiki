const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const { sendApprovalEmail, sendRejectionEmail } = require("../utils/email");

const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Apply auth & admin protection to all admin routes
router.use(requireAuth, requireAdmin);

// Helper function to find user by ObjectId or email
async function findUserByIdOrEmail(identifier) {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier);
  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const user = await User.findById(decoded);
    if (user) return user;
  }
  return await User.findOne({ email: decoded.toLowerCase() });
}

// GET all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    users.forEach((u) => {
      delete u.password;
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Update approval status
router.put("/users/:id/approval", async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.approvalStatus = status;
    if (reason) {
      user.rejectionReason = String(reason);
    }
    await user.save();

    try {
      if (status === "approved") {
        await sendApprovalEmail(user.email, user.name);
      } else if (status === "rejected") {
        await sendRejectionEmail(user.email, user.name, reason || "");
      }
    } catch (mailError) {
      console.error("[ADMIN APPROVAL EMAIL ERROR]", mailError);
      return res.status(502).json({
        message: "Status updated, but the notification email could not be sent.",
      });
    }

    const updated = user.toObject();
    delete updated.password;

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE user account
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) {
      return res.json({ message: "User account deleted successfully." });
    }

    if (user.email === "admin@grandwiki.com") {
      return res.status(400).json({ message: "Super admin account cannot be deleted." });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "User account deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
