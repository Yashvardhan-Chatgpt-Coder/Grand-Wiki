const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "Bell",
      maxlength: 5000, // Allow long SVG strings
    },
    stopAfter: {
      type: Number,
      required: true,
    },
    stopAfterUnit: {
      type: String,
      enum: ["Mins", "Hours", "Days"],
      default: "Days",
    },
    color: {
      type: String,
      default: "blue",
    },
    link: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "active", "expired"],
      default: "draft",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of active notifications
notificationSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
