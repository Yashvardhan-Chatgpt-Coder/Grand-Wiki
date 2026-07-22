const express = require("express");
const Donation = require("../models/Donation");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function serializeDonation(donation) {
  return {
    _id: donation._id.toString(),
    id: donation._id.toString(),
    name: donation.name,
    amount: donation.amount,
    server: donation.server,
    status: donation.status,
    proofUrl: donation.proofUrl || null,
    notes: donation.notes || "",
    createdAt: donation.createdAt?.toISOString?.() || donation.createdAt,
    updatedAt: donation.updatedAt?.toISOString?.() || donation.updatedAt,
  };
}

router.get("/stats", async (_req, res, next) => {
  try {
    const [result] = await Donation.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    res.json({ total: result?.total || 0 });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const donations = await Donation.find({ status: "active" })
      .sort({ amount: -1, createdAt: -1 })
      .lean();
    res.json(donations.map(serializeDonation));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/all", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).lean();
    res.json(donations.map(serializeDonation));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const amount = Number(req.body.amount);
    const server = String(req.body.server || "").trim();

    if (!name || !server || Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: "Name, amount, and server are required." });
    }

    const donation = await Donation.create({
      name,
      amount,
      server,
      status: req.body.status || "active",
      proofUrl: req.body.proofUrl || null,
      notes: req.body.notes || "",
      createdBy: req.user._id,
    });

    res.status(201).json(serializeDonation(donation));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found." });
    }

    if (req.body.name !== undefined) donation.name = String(req.body.name).trim();
    if (req.body.amount !== undefined) donation.amount = Number(req.body.amount);
    if (req.body.server !== undefined) donation.server = String(req.body.server).trim();
    if (req.body.status !== undefined) donation.status = req.body.status;
    if (req.body.proofUrl !== undefined) donation.proofUrl = req.body.proofUrl || null;
    if (req.body.notes !== undefined) donation.notes = req.body.notes || "";

    await donation.save();
    res.json(serializeDonation(donation));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found." });
    }
    res.json({ message: "Donation deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
