const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    server: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "pending", "hidden"],
      default: "active",
    },
    proofUrl: { type: String, default: null },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    collection: "donations",
  },
);

donationSchema.index({ status: 1, amount: -1 });

module.exports = mongoose.model("Donation", donationSchema);
