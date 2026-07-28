const express = require("express");
const Notification = require("../models/Notification");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function serializeNotification(notification) {
  return {
    _id: notification._id.toString(),
    id: notification._id.toString(),
    title: notification.title,
    description: notification.description,
    icon: notification.icon,
    stopAfter: notification.stopAfter,
    stopAfterUnit: notification.stopAfterUnit,
    color: notification.color,
    link: notification.link || "",
    status: notification.status,
    expiresAt: notification.expiresAt?.toISOString?.() || notification.expiresAt,
    createdAt: notification.createdAt?.toISOString?.() || notification.createdAt,
    updatedAt: notification.updatedAt?.toISOString?.() || notification.updatedAt,
  };
}

// Calculate expiration date based on stopAfter and unit
function calculateExpiresAt(stopAfter, stopAfterUnit) {
  const now = new Date();
  const minutes = stopAfterUnit === "Mins" ? stopAfter : 
                  stopAfterUnit === "Hours" ? stopAfter * 60 : 
                  stopAfter * 60 * 24;
  return new Date(now.getTime() + minutes * 60 * 1000);
}

// Public route - Get active notifications
router.get("/", async (_req, res, next) => {
  try {
    const now = new Date();
    
    // Find active notifications that haven't expired
    const notifications = await Notification.find({
      status: "active",
      expiresAt: { $gt: now }
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[NOTIFICATIONS] Found ${notifications.length} active notifications`);
    
    // Update expired notifications
    await Notification.updateMany(
      {
        status: "active",
        expiresAt: { $lte: now }
      },
      {
        $set: { status: "expired" }
      }
    );

    res.json(notifications.map(serializeNotification));
  } catch (error) {
    console.error('[NOTIFICATIONS ERROR]', error);
    next(error);
  }
});

// Admin route - Get all notifications (including expired)
router.get("/admin/all", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications.map(serializeNotification));
  } catch (error) {
    next(error);
  }
});

// Admin route - Create notification
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, description, icon, stopAfter, stopAfterUnit, color, link, status } = req.body;

    if (!title || !description || !stopAfter) {
      return res.status(400).json({ 
        message: "Title, description, and stop after duration are required." 
      });
    }

    const expiresAt = calculateExpiresAt(
      Number(stopAfter), 
      stopAfterUnit || "Days"
    );

    const notification = await Notification.create({
      title: String(title).trim(),
      description: String(description).trim(),
      icon: icon || "Bell",
      stopAfter: Number(stopAfter),
      stopAfterUnit: stopAfterUnit || "Days",
      color: color || "blue",
      link: link || "",
      status: status || "draft",
      expiresAt,
      createdBy: req.user._id,
    });

    console.log(`[NOTIFICATION CREATED] ID: ${notification._id}, Status: ${notification.status}, Title: ${notification.title}`);

    res.status(201).json(serializeNotification(notification));
  } catch (error) {
    next(error);
  }
});

// Admin route - Update notification
router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (req.body.title !== undefined) notification.title = String(req.body.title).trim();
    if (req.body.description !== undefined) notification.description = String(req.body.description).trim();
    if (req.body.icon !== undefined) notification.icon = req.body.icon;
    if (req.body.color !== undefined) notification.color = req.body.color;
    if (req.body.link !== undefined) notification.link = req.body.link || "";
    if (req.body.status !== undefined) notification.status = req.body.status;

    // Recalculate expiration if stopAfter or unit changed
    if (req.body.stopAfter !== undefined || req.body.stopAfterUnit !== undefined) {
      notification.stopAfter = Number(req.body.stopAfter ?? notification.stopAfter);
      notification.stopAfterUnit = req.body.stopAfterUnit ?? notification.stopAfterUnit;
      notification.expiresAt = calculateExpiresAt(
        notification.stopAfter,
        notification.stopAfterUnit
      );
    }

    await notification.save();
    res.json(serializeNotification(notification));
  } catch (error) {
    next(error);
  }
});

// Admin route - Delete notification
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.json({ message: "Notification deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
