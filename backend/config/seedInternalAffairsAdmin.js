const bcrypt = require("bcryptjs");
const { getInternalAffairsModels } = require("../models/internalAffairs");

/**
 * Provisioning is opt-in and reads only deployment secrets. No usable
 * Internal Affairs credential is present in the repository.
 */
async function seedInternalAffairsAdmin() {
  const email = String(process.env.IA_INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.IA_INITIAL_ADMIN_PASSWORD || "");
  const name = String(process.env.IA_INITIAL_ADMIN_NAME || "Internal Affairs Administrator").trim();
  const organisation = String(process.env.IA_INITIAL_ADMIN_ORGANISATION || "Internal Affairs").trim();
  const rank = String(process.env.IA_INITIAL_ADMIN_RANK || "Internal Affairs").trim();

  if (!email || !password) {
    console.warn("[IA] Initial administrator not provisioned. Set IA_INITIAL_ADMIN_EMAIL and IA_INITIAL_ADMIN_PASSWORD in deployment secrets.");
    return;
  }
  if (password.length < 12) {
    throw new Error("IA_INITIAL_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const { IaUser } = await getInternalAffairsModels();
  const existing = await IaUser.findOne({ email });
  if (existing) return;

  await IaUser.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    organisation,
    rank,
    isAdmin: true,
  });
  console.log(`[IA] Initial administrator provisioned for ${email}.`);
}

module.exports = { seedInternalAffairsAdmin };
