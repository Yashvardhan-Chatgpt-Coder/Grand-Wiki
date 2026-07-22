const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");
const { signToken, requireAuth } = require("../middleware/auth");
const { profileUpload } = require("../middleware/upload");
const { serializeUser, parseJsonField } = require("../utils/serializeUser");
const { generateOtp, sendOtpEmail } = require("../utils/email");
const {
  uploadUserImage,
  deleteUserImage,
  extractPublicIdFromUrl,
} = require("../config/cloudinary");

const router = express.Router();
const OTP_TTL_MS = 10 * 60 * 1000;

router.post("/send-otp", async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await OtpVerification.deleteMany({ email });
    await OtpVerification.create({ email, otp, expiresAt });
    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent successfully." });
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const otp = String(req.body.otp || "").trim();

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: "Name, email, password, and OTP are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const otpRecord = await OtpVerification.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code." });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Verification code has expired." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      appearanceMode: "light",
      approvalStatus: "not_submitted",
    });

    await OtpVerification.deleteMany({ email });

    const token = signToken(user._id);
    res.status(201).json(serializeUser(user, token));
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.approvalStatus === "pending") {
      return res.status(403).json({ message: "Your account is pending administrator approval." });
    }
    if (user.approvalStatus === "rejected") {
      return res.status(403).json({ message: "Your account registration was rejected." });
    }

    user.password = undefined;
    const token = signToken(user._id);
    res.json(serializeUser(user, token));
  } catch (error) {
    next(error);
  }
});

router.get("/profile", requireAuth, async (req, res) => {
  res.json(serializeUser(req.user));
});

router.put("/profile", requireAuth, profileUpload, async (req, res, next) => {
  try {
    const user = req.user;
    const body = req.body || {};

    if (body.name !== undefined) user.name = String(body.name).trim();
    if (body.email !== undefined) {
      const nextEmail = String(body.email).trim().toLowerCase();
      if (nextEmail !== user.email) {
        const taken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
        if (taken) {
          return res.status(409).json({ message: "Email is already in use." });
        }
        user.email = nextEmail;
      }
    }
    if (body.phone !== undefined) user.phone = String(body.phone || "");
    if (body.dob !== undefined) user.dob = body.dob || null;
    if (body.gender !== undefined) user.gender = body.gender || "Male";
    if (body.timezone !== undefined) user.timezone = body.timezone || "";
    if (body.appearanceMode !== undefined) user.appearanceMode = body.appearanceMode;
    if (body.server !== undefined) user.server = body.server || "ENGLISH #1";
    if (body.inGameId !== undefined) user.inGameId = body.inGameId || "";
    if (body.badgeNumber !== undefined) user.badgeNumber = body.badgeNumber || "";

    const organization = parseJsonField(body.organization, user.organization?.toObject?.() || {});
    if (body.organization !== undefined) {
      user.organization = {
        name: organization.name || "",
        logo: organization.logo || user.organization?.logo || "",
      };
    }

    const integrations = parseJsonField(body.integrations, user.integrations?.toObject?.() || {});
    if (body.integrations !== undefined) {
      user.integrations = {
        discordWebhookUrl: integrations.discordWebhookUrl || "",
        twitchChannelUrl: integrations.twitchChannelUrl || "",
      };
    }

    const avatarFile = req.files?.avatar?.[0];
    if (avatarFile) {
      if (user.avatarPublicId) await deleteUserImage(user.avatarPublicId);
      const result = await uploadUserImage(avatarFile.buffer, {
        subfolder: "avatars",
        publicId: `user-${user._id}-avatar`,
      });
      user.avatar = result.secure_url;
      user.avatarPublicId = result.public_id;
    }

    const orgLogoFile = req.files?.organizationLogo?.[0];
    if (orgLogoFile) {
      const oldOrgPublicId = extractPublicIdFromUrl(user.organization?.logo);
      if (oldOrgPublicId) await deleteUserImage(oldOrgPublicId);
      const result = await uploadUserImage(orgLogoFile.buffer, {
        subfolder: "organization-logos",
        publicId: `user-${user._id}-org-logo`,
      });
      user.organization = {
        name: user.organization?.name || "",
        logo: result.secure_url,
      };
    }

    const screenshotFile = req.files?.inGameScreenshot?.[0];
    if (screenshotFile) {
      if (user.inGameScreenshotPublicId) await deleteUserImage(user.inGameScreenshotPublicId);
      const result = await uploadUserImage(screenshotFile.buffer, {
        subfolder: "in-game-screenshots",
        publicId: `user-${user._id}-ingame`,
      });
      user.inGameScreenshotUrl = result.secure_url;
      user.inGameScreenshotPublicId = result.public_id;
      user.approvalStatus = "pending";
    }

    await user.save();
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
});

router.put("/password", requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
});

router.put("/pinned", requireAuth, async (req, res, next) => {
  try {
    const pinnedCommands = Array.isArray(req.body.pinnedCommands) ? req.body.pinnedCommands : [];
    const pinnedGroups = Array.isArray(req.body.pinnedGroups) ? req.body.pinnedGroups : [];

    req.user.pinnedCommands = pinnedCommands.map((item) => ({
      orgKey: String(item.orgKey || ""),
      category: String(item.category || ""),
      group: String(item.group || ""),
      command: String(item.command || ""),
    }));
    req.user.pinnedGroups = pinnedGroups.map((item) => ({
      orgKey: String(item.orgKey || ""),
      category: String(item.category || ""),
      group: String(item.group || ""),
    }));

    await req.user.save();
    res.json({
      pinnedCommands: req.user.pinnedCommands,
      pinnedGroups: req.user.pinnedGroups,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully." });
});

module.exports = router;
