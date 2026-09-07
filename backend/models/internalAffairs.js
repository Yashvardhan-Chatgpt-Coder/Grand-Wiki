const mongoose = require("mongoose");
const { connectInternalAffairsDatabase } = require("../config/internalAffairsDatabase");

const { Schema } = mongoose;

const loaSchema = new Schema(
  {
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    addedBy: { type: String, required: true },
  },
  { _id: true, timestamps: true },
);

const strikeSchema = new Schema(
  {
    reason: { type: String, required: true, trim: true },
    addedBy: { type: String, required: true },
  },
  { _id: true, timestamps: true },
);

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    passportNumber: { type: String, required: true, trim: true, unique: true, index: true },
    badgeNumber: { type: String, default: "", trim: true },
    discordUsername: { type: String, default: "", trim: true },
    rank: { type: String, required: true, trim: true },
    primaryDepartment: { type: String, default: "", trim: true },
    secondaryDepartment: { type: String, default: "", trim: true },
    joiningDate: { type: String, default: "" },
    logsAssigned: { type: Boolean, default: false },
    badgeNumberAssigned: { type: Boolean, default: false },
    discordRoles: { type: Boolean, default: false },
    hiringRecord: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
    leftDate: { type: String, default: "" },
    leftReason: { type: String, default: "" },
    rolesRemoved: { type: Boolean, default: false },
    strikes: { type: [strikeSchema], default: [] },
    loas: { type: [loaSchema], default: [] },
  },
  { timestamps: true, collection: "members" },
);

const iaUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    organisation: { type: String, required: true, trim: true },
    rank: { type: String, default: "Internal Affairs" },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "users" },
);

const dailyLogCheckSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "InternalAffairsMember", required: true, index: true },
    date: { type: String, required: true, index: true },
    checkedBy: { type: String, required: true },
    checkedByUserId: { type: Schema.Types.ObjectId, ref: "InternalAffairsUser", required: true },
  },
  { timestamps: true, collection: "daily_log_checks" },
);
dailyLogCheckSchema.index({ memberId: 1, date: 1 }, { unique: true });

const licenseCheckSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "InternalAffairsMember", required: true, index: true },
    date: { type: String, required: true, index: true },
    driverLicense: { type: Boolean, required: true },
    weaponsLicense: { type: Boolean, required: true },
    healthInsurance: { type: Boolean, required: true },
    lawyerLicense: { type: Boolean, default: null },
    checkedBy: { type: String, required: true },
    checkedByUserId: { type: Schema.Types.ObjectId, ref: "InternalAffairsUser", required: true },
  },
  { timestamps: true, collection: "license_checks" },
);

const backgroundCheckSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "InternalAffairsMember", required: true, index: true },
    date: { type: String, required: true, index: true },
    wanted: { type: Boolean, required: true },
    prisonTerms: { type: Boolean, required: true },
    previousCrimes: { type: Boolean, required: true },
    criminalStructures: { type: Boolean, required: true },
    checkedBy: { type: String, required: true },
    checkedByUserId: { type: Schema.Types.ObjectId, ref: "InternalAffairsUser", required: true },
  },
  { timestamps: true, collection: "background_checks" },
);

const bodycamRequestSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "InternalAffairsMember", required: true, index: true },
    requestType: { type: String, enum: ["arrest", "activity"], required: true },
    suspectName: { type: String, default: "" },
    arrestDate: { type: String, default: "" },
    arrestTime: { type: String, default: "" },
    deadline: { type: String, default: "" },
    status: { type: String, enum: ["pending", "provided", "not_provided"], default: "pending" },
    requestedBy: { type: String, required: true },
    requestedByUserId: { type: Schema.Types.ObjectId, ref: "InternalAffairsUser", required: true },
  },
  { timestamps: true, collection: "bodycam_requests" },
);

const bodycamCheckSchema = new Schema(
  {
    memberIds: { type: [Schema.Types.ObjectId], default: [] },
    date: { type: String, required: true, index: true },
    checkedBy: { type: String, required: true },
    checkedByUserId: { type: Schema.Types.ObjectId, ref: "InternalAffairsUser", required: true },
  },
  { timestamps: true, collection: "bodycam_checks" },
);

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "InternalAffairsUser", required: true, index: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, default: "" },
    actorRank: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    details: { type: String, default: "" },
    entityType: { type: String, required: true },
    entityId: { type: String, default: "" },
    entityName: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "audit_logs" },
);

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    departments: { type: [String], default: [] },
    ranks: { type: [String], default: [] },
  },
  { timestamps: true, collection: "settings" },
);

async function getInternalAffairsModels() {
  const connection = await connectInternalAffairsDatabase();
  const get = (name, schema, collection) => connection.models[name] || connection.model(name, schema, collection);
  return {
    IaUser: get("InternalAffairsUser", iaUserSchema, "users"),
    Member: get("InternalAffairsMember", memberSchema, "members"),
    DailyLogCheck: get("InternalAffairsDailyLogCheck", dailyLogCheckSchema, "daily_log_checks"),
    LicenseCheck: get("InternalAffairsLicenseCheck", licenseCheckSchema, "license_checks"),
    BackgroundCheck: get("InternalAffairsBackgroundCheck", backgroundCheckSchema, "background_checks"),
    BodycamRequest: get("InternalAffairsBodycamRequest", bodycamRequestSchema, "bodycam_requests"),
    BodycamCheck: get("InternalAffairsBodycamCheck", bodycamCheckSchema, "bodycam_checks"),
    AuditLog: get("InternalAffairsAuditLog", auditLogSchema, "audit_logs"),
    Settings: get("InternalAffairsSettings", settingsSchema, "settings"),
  };
}

module.exports = { getInternalAffairsModels };
