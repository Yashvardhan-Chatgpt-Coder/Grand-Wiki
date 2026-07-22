const Donation = require("../models/Donation");

const INITIAL_DONATIONS = [
  { name: "Marcus Vale", amount: 2450000, server: "EN1", status: "active" },
  { name: "Elena Cross", amount: 1820000, server: "EN3", status: "active" },
  { name: "Jordan Pike", amount: 1150000, server: "EN1", status: "active" },
  { name: "Sofia Reyes", amount: 980000, server: "EN3", status: "active" },
  { name: "Tyler Nash", amount: 740000, server: "EN1", status: "active" },
  { name: "Aiden Brooks", amount: 620000, server: "EN3", status: "active" },
  { name: "Mia Chen", amount: 510000, server: "EN1", status: "active" },
  { name: "Noah Sterling", amount: 425000, server: "EN3", status: "active" },
  { name: "Liam Ortiz", amount: 380000, server: "EN1", status: "active" },
  { name: "Harper Quinn", amount: 295000, server: "EN3", status: "active" },
];

async function seedDonations() {
  try {
    const count = await Donation.countDocuments();
    if (count === 0) {
      await Donation.insertMany(INITIAL_DONATIONS);
      console.log(`[SEED] Initialized ${INITIAL_DONATIONS.length} donation records into MongoDB.`);
    }
  } catch (error) {
    console.error("[SEED] Error seeding donations:", error.message);
  }
}

module.exports = { seedDonations };
