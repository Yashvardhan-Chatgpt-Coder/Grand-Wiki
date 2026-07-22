const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedAdminUser() {
  try {
    const adminEmail = "admin@grandwiki.com";
    const plainPassword = "superchat9897";

    let admin = await User.findOne({ email: adminEmail }).select("+password");

    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    if (!admin) {
      admin = await User.create({
        name: "Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        approvalStatus: "approved",
        server: "ENGLISH #1",
        badgeNumber: "001"
      });
      console.log(`[SEED] Admin account created successfully: ${adminEmail}`);
    } else {
      admin.password = hashedPassword;
      admin.role = "admin";
      admin.approvalStatus = "approved";
      await admin.save();
      console.log(`[SEED] Admin account updated/verified successfully: ${adminEmail}`);
    }
  } catch (error) {
    console.error("[SEED] Error seeding admin user:", error.message);
  }
}

module.exports = { seedAdminUser };
