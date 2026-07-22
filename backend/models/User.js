const mongoose = require("mongoose");

const pinnedCommandSchema = new mongoose.Schema(
  {
    orgKey: { type: String, required: true },
    category: { type: String, required: true },
    group: { type: String, required: true },
    command: { type: String, required: true },
  },
  { _id: false },
);

const pinnedGroupSchema = new mongoose.Schema(
  {
    orgKey: { type: String, required: true },
    category: { type: String, required: true },
    group: { type: String, required: true },
  },
  { _id: false },
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    logo: { type: String, default: "" },
  },
  { _id: false },
);

const integrationsSchema = new mongoose.Schema(
  {
    discordWebhookUrl: { type: String, default: "" },
    twitchChannelUrl: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    phone: { type: String, default: "" },
    dob: { type: String, default: null },
    gender: { type: String, default: "Male" },
    timezone: { type: String, default: "" },
    organization: { type: organizationSchema, default: () => ({}) },
    appearanceMode: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "light",
    },
    integrations: { type: integrationsSchema, default: () => ({}) },
    role: { type: String, enum: ["organizer", "admin"], default: "organizer" },
    server: { type: String, default: "ENGLISH #1" },
    inGameId: { type: String, default: "" },
    badgeNumber: { type: String, default: "" },
    pinnedCommands: { type: [pinnedCommandSchema], default: [] },
    pinnedGroups: { type: [pinnedGroupSchema], default: [] },
    inGameScreenshotUrl: { type: String, default: null },
    inGameScreenshotPublicId: { type: String, default: null },
    approvalStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    rejectionReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

module.exports = mongoose.model("User", userSchema);
