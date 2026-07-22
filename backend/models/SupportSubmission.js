const mongoose = require("mongoose");

const supportSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: {
      type: String,
      enum: ["Suggestion", "Bug Report"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["New", "In review", "Resolved"],
      default: "New",
    },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "support_submissions",
  },
);

module.exports = mongoose.model("SupportSubmission", supportSubmissionSchema);
