const express = require("express");
const bcrypt = require("bcryptjs");
const {
  signInternalAffairsToken,
  requireInternalAffairsAuth,
  requireInternalAffairsAdmin,
} = require("../middleware/internalAffairsAuth");
const { getInternalAffairsModels } = require("../models/internalAffairs");

const router = express.Router();
const UK_TIME_ZONE = "Europe/London";

const INITIAL_DEPARTMENTS = ["Patrol", "Traffic Division", "Detective Bureau", "Internal Affairs", "High Command"];
const INITIAL_RANKS = [
  "30 - Chief of Police",
  "29 - Deputy Chief of Police",
  "28 - Police Commissioner",
  "27 - District Attorney",
  "26 - Chief of Department",
  "25 - Deputy Chief of Department",
  "24 - Superintendent of Police",
  "23 - Deputy Superintendent",
  "22 - Major of Police",
  "21 - Captain of Police",
  "20 - Senior Inspector",
  "19 - Inspector",
  "18 - Master Lieutenant",
  "17 - Senior Lieutenant",
  "16 - Lieutenant",
  "15 - Supervisor of Police",
  "14 - Deputy Supervisor of Police",
  "13 - Master Sergeant",
  "12 - Senior Sergeant",
  "11 - Sergeant",
  "10 - Master Corporal",
  "9 - Senior Corporal",
  "8 - Corporal",
  "7 - Master Patrol Officer",
  "6 - Senior Patrol Officer",
  "5 - Patrol Officer",
  "4 - Rookie",
  "3 - Trainee",
  "2 - Leave of absence",
  "1 - Suspended",
];

function londonDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: UK_TIME_ZONE }).format(new Date());
}

function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function clean(value) {
  return String(value || "").trim();
}

function serialize(document) {
  if (!document) return document;
  const object = document.toObject ? document.toObject() : document;
  const { _id, __v, password, ...rest } = object;
  if (Array.isArray(rest.memberIds)) {
    rest.memberIds = rest.memberIds.map((item) => String(item));
  }
  return { id: String(_id), ...rest };
}

function serializeUser(user) {
  const serialized = serialize(user);
  return {
    id: serialized.id,
    name: serialized.name,
    email: serialized.email,
    organisation: serialized.organisation,
    rank: serialized.rank || "Internal Affairs",
    isAdmin: Boolean(serialized.isAdmin),
    createdAt: serialized.createdAt,
  };
}

async function settings(models) {
  const record = await models.Settings.findOneAndUpdate(
    { key: "organisation" },
    { $setOnInsert: { departments: INITIAL_DEPARTMENTS, ranks: INITIAL_RANKS } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  if ((record.ranks || []).some((rank) => /^(Cadet|Officer I|Officer II|Senior Officer|Commander|Assistant Chief)/i.test(rank))) {
    record.ranks = INITIAL_RANKS;
    await record.save();
  }
  return record;
}

async function audit(models, user, action, entityType, entity, details = "", metadata = {}) {
  return models.AuditLog.create({
    actorId: user._id,
    actorName: user.name,
    actorEmail: user.email,
    actorRank: user.rank,
    action,
    details,
    entityType,
    entityId: entity?._id ? String(entity._id) : entity?.id || "",
    entityName: entity?.name || entity?.passportNumber || "",
    metadata,
  });
}

function changedFields(before, after, fields) {
  return fields.filter((field) => String(before[field] ?? "") !== String(after[field] ?? ""));
}

function activeLoas(member) {
  const today = londonDate();
  return (member.loas || []).filter((loa) => loa.startDate <= today && loa.endDate >= today);
}

function memberWithComputedState(member) {
  const result = serialize(member);
  return {
    ...result,
    strikes: (member.strikes || []).map(serialize),
    loas: (member.loas || []).map(serialize),
    activeLoas: activeLoas(member).map(serialize),
  };
}

function memberPayload(body) {
  return {
    name: clean(body.name),
    passportNumber: clean(body.passportNumber),
    badgeNumber: clean(body.badgeNumber),
    discordUsername: clean(body.discordUsername),
    rank: clean(body.rank),
    primaryDepartment: clean(body.primaryDepartment),
    secondaryDepartment: clean(body.secondaryDepartment),
    joiningDate: clean(body.joiningDate),
    logsAssigned: asBoolean(body.logsAssigned),
    badgeNumberAssigned: asBoolean(body.badgeNumberAssigned),
    discordRoles: asBoolean(body.discordRoles),
    hiringRecord: asBoolean(body.hiringRecord),
  };
}

function memberSnapshot(member) {
  const source = member?.toObject ? member.toObject() : member;
  return {
    name: source.name,
    passportNumber: source.passportNumber,
    badgeNumber: source.badgeNumber || "",
    discordUsername: source.discordUsername || "",
    rank: source.rank,
    primaryDepartment: source.primaryDepartment || "",
    secondaryDepartment: source.secondaryDepartment || "",
    joiningDate: source.joiningDate || "",
    logsAssigned: Boolean(source.logsAssigned),
    badgeNumberAssigned: Boolean(source.badgeNumberAssigned),
    discordRoles: Boolean(source.discordRoles),
    hiringRecord: Boolean(source.hiringRecord),
    status: source.status || "active",
    leftDate: source.leftDate || "",
    leftReason: source.leftReason || "",
    rolesRemoved: Boolean(source.rolesRemoved),
    strikes: (source.strikes || []).map((strike) => ({ ...strike })),
    loas: (source.loas || []).map((loa) => ({ ...loa })),
  };
}

function sameMemberSnapshot(member, snapshot) {
  return JSON.stringify(memberSnapshot(member)) === JSON.stringify(snapshot);
}

function restoreMember(member, snapshot) {
  Object.assign(member, snapshot);
}

function validateMember(payload) {
  if (!payload.name || !payload.rank || !payload.passportNumber) {
    return "Name, passport number, and rank are required.";
  }
  return null;
}

async function findMemberOr404(models, id, res) {
  const member = await models.Member.findById(id);
  if (!member) {
    res.status(404).json({ message: "Member not found." });
    return null;
  }
  return member;
}

router.post("/auth/login", async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const adminOnly = req.body.adminOnly === true;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const { IaUser } = await getInternalAffairsModels();
    const user = await IaUser.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (adminOnly && !user.isAdmin) {
      return res.status(403).json({ message: "This account does not have Internal Affairs administrator access." });
    }

    res.json({ user: serializeUser(user), token: signInternalAffairsToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", requireInternalAffairsAuth, (req, res) => res.json({ user: serializeUser(req.iaUser) }));

router.patch("/auth/profile", requireInternalAffairsAuth, async (req, res, next) => {
  try {
    const rank = clean(req.body.rank);
    if (!rank) {
      return res.status(400).json({ message: "Rank is required." });
    }
    const { IaUser, AuditLog } = await getInternalAffairsModels();
    const user = await IaUser.findById(req.iaUser._id);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }
    const oldRank = user.rank;
    user.rank = rank;
    await user.save();
    await audit({ AuditLog }, user, "SOFTWARE_USER_RANK_UPDATED", "user", user, `Updated profile rank from ${oldRank || "none"} to ${rank}.`);
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.use(requireInternalAffairsAuth);

router.get("/settings", async (_req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    res.json(serialize(await settings(models)));
  } catch (error) {
    next(error);
  }
});

router.patch("/settings", requireInternalAffairsAdmin, async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const previous = await settings(models);
    const update = {};
    if (Array.isArray(req.body.departments)) update.departments = [...new Set(req.body.departments.map(clean).filter(Boolean))];
    if (Array.isArray(req.body.ranks)) update.ranks = [...new Set(req.body.ranks.map(clean).filter(Boolean))];
    const record = await models.Settings.findOneAndUpdate({ key: "organisation" }, { $set: update, $setOnInsert: { key: "organisation" } }, { new: true, upsert: true });
    const changes = [];
    if (update.departments) changes.push(`Departments: ${previous.departments.join(", ") || "none"} → ${record.departments.join(", ") || "none"}`);
    if (update.ranks) changes.push(`Ranks: ${previous.ranks.join(", ") || "none"} → ${record.ranks.join(", ") || "none"}`);
    await audit(models, req.iaUser, "SETTINGS_UPDATED", "settings", record, changes.join(" | ") || "No setting values changed.", { previous: { departments: previous.departments, ranks: previous.ranks }, next: { departments: record.departments, ranks: record.ranks }, undo: { type: "settings", before: { departments: previous.departments, ranks: previous.ranks }, after: { departments: record.departments, ranks: record.ranks } } });
    res.json(serialize(record));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/users", requireInternalAffairsAdmin, async (_req, res, next) => {
  try {
    const { IaUser } = await getInternalAffairsModels();
    const users = await IaUser.find().sort({ name: 1 });
    res.json(users.map(serializeUser));
  } catch (error) {
    next(error);
  }
});

router.post("/admin/users", requireInternalAffairsAdmin, async (req, res, next) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const organisation = clean(req.body.organisation);
    const rank = clean(req.body.rank);
    if (!name || !email || !organisation || !rank || !password) {
      return res.status(400).json({ message: "Name, email, password, organisation, and rank are required." });
    }
    if (password.length < 12) return res.status(400).json({ message: "Use a password of at least 12 characters." });
    const { IaUser, AuditLog } = await getInternalAffairsModels();
    const existing = await IaUser.findOne({ email });
    if (existing) return res.status(409).json({ message: "An Internal Affairs account with that email already exists." });
    const user = await IaUser.create({ name, email, password: await bcrypt.hash(password, 12), organisation, rank });
    await audit({ AuditLog }, req.iaUser, "SOFTWARE_USER_CREATED", "user", user, `Created Internal Affairs account for ${name}.`);
    res.status(201).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/users/:id", requireInternalAffairsAdmin, async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    if (String(req.iaUser._id) === String(req.params.id)) return res.status(400).json({ message: "You cannot delete your own account." });
    const user = await models.IaUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Software account not found." });
    if (user.isAdmin && await models.IaUser.countDocuments({ isAdmin: true }) <= 1) {
      return res.status(409).json({ message: "The last administrator account cannot be deleted." });
    }
    await models.IaUser.deleteOne({ _id: user._id });
    await audit(models, req.iaUser, "SOFTWARE_USER_DELETED", "user", user, `Deleted Internal Affairs account for ${user.name}.`);
    res.json({ message: "Software account deleted." });
  } catch (error) {
    next(error);
  }
});

router.get("/members", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const query = {};
    if (req.query.status === "active" || req.query.status === "archived") query.status = req.query.status;
    if (req.query.department) query.primaryDepartment = clean(req.query.department);
    if (req.query.rank) query.rank = clean(req.query.rank);
    if (req.query.search) {
      const pattern = new RegExp(clean(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: pattern }, { passportNumber: pattern }, { discordUsername: pattern }, { rank: pattern }];
    }
    const [members, rankSettings] = await Promise.all([
      models.Member.find(query),
      settings(models),
    ]);
    const rankOrder = new Map((rankSettings.ranks || []).map((rank, index) => [rank, index]));
    members.sort((a, b) => {
      const rankDifference = (rankOrder.get(a.rank) ?? Number.MAX_SAFE_INTEGER) - (rankOrder.get(b.rank) ?? Number.MAX_SAFE_INTEGER);
      return rankDifference || a.name.localeCompare(b.name);
    });
    res.json(members.map(memberWithComputedState));
  } catch (error) {
    next(error);
  }
});

router.post("/members", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const payload = memberPayload(req.body);
    const invalid = validateMember(payload);
    if (invalid) return res.status(400).json({ message: invalid });
    const existing = await models.Member.findOne({ passportNumber: payload.passportNumber });
    if (existing?.status === "archived") {
      return res.status(409).json({ message: "This passport number belongs to an archived member. Rehire that member instead.", archivedMemberId: String(existing._id) });
    }
    if (existing) return res.status(409).json({ message: "A current member already uses that passport number." });
    const member = await models.Member.create(payload);
    await audit(models, req.iaUser, "MEMBER_CREATED", "member", member, `Created member record for ${member.name}.`, { undo: { type: "member", after: memberSnapshot(member) } });
    res.status(201).json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.patch("/members/:id", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const payload = memberPayload({ ...member.toObject(), ...req.body });
    const invalid = validateMember(payload);
    if (invalid) return res.status(400).json({ message: invalid });
    if (payload.passportNumber !== member.passportNumber) {
      const passportOwner = await models.Member.findOne({ passportNumber: payload.passportNumber, _id: { $ne: member._id } });
      if (passportOwner) return res.status(409).json({ message: "That passport number is already in use." });
    }
    const before = member.toObject();
    Object.assign(member, payload);
    await member.save();
    const fields = ["name", "passportNumber", "badgeNumber", "discordUsername", "rank", "primaryDepartment", "secondaryDepartment", "joiningDate", "logsAssigned", "badgeNumberAssigned", "discordRoles", "hiringRecord"];
    const changes = changedFields(before, member, fields).map((field) => `${field}: ${before[field] || "none"} → ${member[field] || "none"}`);
    await audit(models, req.iaUser, "MEMBER_UPDATED", "member", member, changes.length ? `Updated ${member.name}: ${changes.join("; ")}.` : `Saved ${member.name} with no field changes.` , { changes, undo: { type: "member", before: memberSnapshot(before), after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.delete("/members/:id", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    await models.Member.deleteOne({ _id: member._id });
    await audit(models, req.iaUser, "MEMBER_DELETED", "member", member, `Permanently deleted member record for ${member.name}.`, { undo: { type: "member", before: memberSnapshot(member) } });
    res.json({ message: "Member deleted." });
  } catch (error) {
    next(error);
  }
});

router.post("/members/:id/fire", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const reason = clean(req.body.reason);
    if (!reason) return res.status(400).json({ message: "A firing reason is required." });
    const before = memberSnapshot(member);
    member.status = "archived";
    member.leftDate = londonDate();
    member.leftReason = reason;
    member.rolesRemoved = false;
    await member.save();
    await audit(models, req.iaUser, "MEMBER_FIRED", "member", member, `Moved ${member.name} to Archives.`, { reason, undo: { type: "member", before, after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.post("/members/:id/rehire", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const payload = memberPayload({ ...member.toObject(), ...req.body });
    const invalid = validateMember(payload);
    if (invalid) return res.status(400).json({ message: invalid });
    const before = memberSnapshot(member);
    Object.assign(member, payload, { status: "active", leftDate: "", leftReason: "", rolesRemoved: false });
    await member.save();
    await audit(models, req.iaUser, "MEMBER_REHIRED", "member", member, `Rehired ${member.name} from Archives.`, { undo: { type: "member", before, after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.post("/members/:id/rank-change", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const newRank = clean(req.body.newRank);
    const reason = clean(req.body.reason);
    if (!newRank || !reason) return res.status(400).json({ message: "A new rank and reason are required." });
    const before = memberSnapshot(member);
    const oldRank = member.rank;
    member.rank = newRank;
    await member.save();
    await audit(models, req.iaUser, "RANK_CHANGED", "member", member, `${member.name}: ${oldRank} to ${newRank}.`, { oldRank, newRank, reason, undo: { type: "member", before, after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.post("/members/:id/strikes", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const before = memberSnapshot(member);
    const reason = clean(req.body.reason);
    if (!reason) return res.status(400).json({ message: "A strike reason is required." });
    member.strikes.push({ reason, addedBy: req.iaUser.name });
    await member.save();
    await audit(models, req.iaUser, "STRIKE_ADDED", "member", member, `Added a strike to ${member.name}.`, { reason, undo: { type: "member", before, after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.post("/members/:id/loa", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const before = memberSnapshot(member);
    const startDate = clean(req.body.startDate);
    const endDate = clean(req.body.endDate);
    const reason = clean(req.body.reason);
    if (!startDate || !endDate || !reason) return res.status(400).json({ message: "LOA start date, end date, and reason are required." });
    if (endDate < startDate) return res.status(400).json({ message: "The LOA end date must be on or after the start date." });
    member.loas.push({ startDate, endDate, reason, addedBy: req.iaUser.name });
    await member.save();
    await audit(models, req.iaUser, "LOA_ADDED", "member", member, `Recorded LOA for ${member.name}.`, { startDate, endDate, reason, undo: { type: "member", before, after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.post("/members/:id/roles-removed", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const member = await findMemberOr404(models, req.params.id, res);
    if (!member) return;
    const before = memberSnapshot(member);
    member.rolesRemoved = true;
    member.discordRoles = false;
    await member.save();
    await audit(models, req.iaUser, "ROLES_REMOVED", "member", member, `Marked organisation roles removed for ${member.name}.`, { undo: { type: "member", before, after: memberSnapshot(member) } });
    res.json(memberWithComputedState(member));
  } catch (error) {
    next(error);
  }
});

router.get("/checks/daily", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const date = clean(req.query.date) || londonDate();
    const checks = await models.DailyLogCheck.find({ date });
    res.json({ date, checks: checks.map(serialize) });
  } catch (error) {
    next(error);
  }
});

router.post("/checks/daily", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const date = clean(req.body.date) || londonDate();
    const memberIds = [...new Set(Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [])];
    await models.DailyLogCheck.deleteMany({ date });
    if (memberIds.length) {
      await models.DailyLogCheck.insertMany(memberIds.map((memberId) => ({ memberId, date, checkedBy: req.iaUser.name, checkedByUserId: req.iaUser._id })));
    }
    await audit(models, req.iaUser, "DAILY_LOG_CHECK_SAVED", "daily_log_check", { id: date, name: date }, `Saved daily log check for ${date}.`, { memberCount: memberIds.length });
    res.json({ date, checkedMemberIds: memberIds });
  } catch (error) {
    next(error);
  }
});

router.get("/checks/license", async (_req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const checks = await models.LicenseCheck.find().sort({ createdAt: -1 }).limit(500);
    res.json(checks.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.post("/checks/license", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const date = clean(req.body.date) || londonDate();
    const checks = Array.isArray(req.body.checks) ? req.body.checks : [];
    if (!checks.length) return res.status(400).json({ message: "Select at least one member for this license check." });
    const documents = checks.map((check) => ({
      memberId: check.memberId,
      date,
      driverLicense: asBoolean(check.driverLicense),
      weaponsLicense: asBoolean(check.weaponsLicense),
      healthInsurance: asBoolean(check.healthInsurance),
      lawyerLicense: check.lawyerLicense === null ? null : asBoolean(check.lawyerLicense),
      checkedBy: req.iaUser.name,
      checkedByUserId: req.iaUser._id,
    }));
    const created = await models.LicenseCheck.insertMany(documents);
    await audit(models, req.iaUser, "LICENSE_CHECK_SAVED", "license_check", { id: date, name: date }, `Saved ${created.length} license check record(s).`);
    res.status(201).json(created.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.get("/checks/background", async (_req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const checks = await models.BackgroundCheck.find().sort({ createdAt: -1 }).limit(500);
    res.json(checks.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.post("/checks/background", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const date = clean(req.body.date) || londonDate();
    const checks = Array.isArray(req.body.checks) ? req.body.checks : [];
    if (!checks.length) return res.status(400).json({ message: "Select at least one member for this background check." });
    const documents = checks.map((check) => ({
      memberId: check.memberId,
      date,
      wanted: asBoolean(check.wanted),
      prisonTerms: asBoolean(check.prisonTerms),
      previousCrimes: asBoolean(check.previousCrimes),
      criminalStructures: asBoolean(check.criminalStructures),
      checkedBy: req.iaUser.name,
      checkedByUserId: req.iaUser._id,
    }));
    const created = await models.BackgroundCheck.insertMany(documents);
    await audit(models, req.iaUser, "BACKGROUND_CHECK_SAVED", "background_check", { id: date, name: date }, `Saved ${created.length} background check record(s).`);
    res.status(201).json(created.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.get("/bodycam/requests", async (_req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const requests = await models.BodycamRequest.find().sort({ createdAt: -1 }).limit(500);
    res.json(requests.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.post("/bodycam/requests", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const memberIds = [...new Set(Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [])];
    const requestType = req.body.requestType === "arrest" ? "arrest" : "activity";
    if (!memberIds.length) return res.status(400).json({ message: "Select at least one member to request bodycam footage from." });
    const created = await models.BodycamRequest.insertMany(memberIds.map((memberId) => ({
      memberId,
      requestType,
      suspectName: clean(req.body.suspectName),
      arrestDate: clean(req.body.arrestDate),
      arrestTime: clean(req.body.arrestTime),
      deadline: clean(req.body.deadline),
      requestedBy: req.iaUser.name,
      requestedByUserId: req.iaUser._id,
    })));
    await audit(models, req.iaUser, "BODYCAM_REQUEST_SENT", "bodycam_request", { id: created[0]._id, name: "Bodycam request" }, `Created ${created.length} bodycam request(s).`);
    res.status(201).json(created.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.patch("/bodycam/requests/:id", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const status = clean(req.body.status);
    if (!["pending", "provided", "not_provided"].includes(status)) return res.status(400).json({ message: "Invalid bodycam request status." });
    const request = await models.BodycamRequest.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!request) return res.status(404).json({ message: "Bodycam request not found." });
    await audit(models, req.iaUser, "BODYCAM_REQUEST_UPDATED", "bodycam_request", request, `Updated bodycam request status to ${status}.`);
    res.json(serialize(request));
  } catch (error) {
    next(error);
  }
});

router.get("/bodycam/checks", async (_req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const checks = await models.BodycamCheck.find().sort({ createdAt: -1 }).limit(200);
    res.json(checks.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.post("/bodycam/checks", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const memberIds = [...new Set(Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [])];
    if (!memberIds.length) return res.status(400).json({ message: "Select at least one member for the final bodycam check." });
    const record = await models.BodycamCheck.create({ memberIds, date: clean(req.body.date) || londonDate(), checkedBy: req.iaUser.name, checkedByUserId: req.iaUser._id });
    await audit(models, req.iaUser, "BODYCAM_CHECK_SAVED", "bodycam_check", record, `Saved final bodycam check for ${memberIds.length} member(s).`);
    res.status(201).json(serialize(record));
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (_req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const today = londonDate();
    const [activeMembers, archivedMembers, checkedToday, bodycamRequests, recentActivity] = await Promise.all([
      models.Member.find({ status: "active" }),
      models.Member.countDocuments({ status: "archived" }),
      models.DailyLogCheck.find({ date: today }),
      models.BodycamRequest.find(),
      models.AuditLog.find().sort({ createdAt: -1 }).limit(10),
    ]);
    const activeLoaMemberIds = new Set(activeMembers.filter((member) => activeLoas(member).length > 0).map((member) => String(member._id)));
    const checkedIds = new Set(checkedToday.map((check) => String(check.memberId)));
    res.json({
      totalMembers: activeMembers.length,
      membersOnLoa: activeLoaMemberIds.size,
      archivedMembers,
      missingLogs: activeMembers.filter((member) => !member.logsAssigned).length,
      missingHiringLogs: activeMembers.filter((member) => !member.hiringRecord).length,
      missingRoles: activeMembers.filter((member) => !member.discordRoles).length,
      archivedMembersWithRoles: await models.Member.countDocuments({ status: "archived", rolesRemoved: false, discordRoles: true }),
      dailyLogProgress: { checked: checkedIds.size, remaining: activeMembers.filter((member) => !checkedIds.has(String(member._id)) && !activeLoaMemberIds.has(String(member._id))).length },
      pendingBodycam: {
        provided: bodycamRequests.filter((request) => request.status === "provided").length,
        notProvided: bodycamRequests.filter((request) => request.status === "not_provided").length,
      },
      recentActivity: recentActivity.map(serialize),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const logs = await models.AuditLog.find().sort({ createdAt: -1 }).limit(limit);
    res.json(logs.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.post("/audit-logs/:id/undo", requireInternalAffairsAdmin, async (req, res, next) => {
  try {
    const models = await getInternalAffairsModels();
    const entry = await models.AuditLog.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Audit log entry not found." });
    const undo = entry.metadata?.undo;
    if (!undo) return res.status(409).json({ message: "This older audit entry does not contain enough saved state to undo safely." });
    if (entry.action === "AUDIT_UNDO") return res.status(409).json({ message: "An undo action cannot be undone." });

    if (undo.type === "settings") {
      const record = await models.Settings.findOne({ key: "organisation" });
      if (!record) return res.status(404).json({ message: "Organisation settings not found." });
      if (JSON.stringify({ departments: record.departments, ranks: record.ranks }) !== JSON.stringify(undo.after)) {
        return res.status(409).json({ message: "These settings have changed since this log. Undo the newer change first." });
      }
      record.departments = undo.before.departments;
      record.ranks = undo.before.ranks;
      await record.save();
      await audit(models, req.iaUser, "AUDIT_UNDO", "settings", record, `Undid audit entry ${entry.action}.`, { undoneAuditId: String(entry._id), targetAction: entry.action });
      return res.json(serialize(record));
    }

    if (undo.type !== "member") return res.status(409).json({ message: "This audit entry cannot be undone safely yet." });
    const current = await models.Member.findById(entry.entityId);
    if (entry.action === "MEMBER_DELETED") {
      if (current) return res.status(409).json({ message: "This member already exists. Undo was stopped to avoid overwriting newer data." });
      const restored = await models.Member.create(undo.before);
      await audit(models, req.iaUser, "AUDIT_UNDO", "member", restored, `Undid audit entry ${entry.action}.`, { undoneAuditId: String(entry._id), targetAction: entry.action });
      return res.json(memberWithComputedState(restored));
    }
    if (!current) return res.status(404).json({ message: "The affected member no longer exists." });
    if (!sameMemberSnapshot(current, undo.after)) {
      return res.status(409).json({ message: "This member has changed since this log. Undo the newer change first." });
    }
    if (entry.action === "MEMBER_CREATED") {
      await models.Member.deleteOne({ _id: current._id });
      await audit(models, req.iaUser, "AUDIT_UNDO", "member", current, `Undid audit entry ${entry.action}.`, { undoneAuditId: String(entry._id), targetAction: entry.action });
      return res.json({ message: "Member creation undone." });
    }
    restoreMember(current, undo.before);
    await current.save();
    await audit(models, req.iaUser, "AUDIT_UNDO", "member", current, `Undid audit entry ${entry.action}.`, { undoneAuditId: String(entry._id), targetAction: entry.action });
    return res.json(memberWithComputedState(current));
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  if (error?.code === 11000) return res.status(409).json({ message: "A record with that unique value already exists." });
  return _next(error);
});

module.exports = router;
