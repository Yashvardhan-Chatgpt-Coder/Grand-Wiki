function serializeUser(user, token) {
  const payload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    phone: user.phone || "",
    dob: user.dob || null,
    gender: user.gender || "Male",
    timezone: user.timezone || "",
    organization: {
      name: user.organization?.name || "",
      logo: user.organization?.logo || "",
    },
    appearanceMode: user.appearanceMode || "light",
    integrations: {
      discordWebhookUrl: user.integrations?.discordWebhookUrl || "",
      twitchChannelUrl: user.integrations?.twitchChannelUrl || "",
    },
    role: user.role || "organizer",
    server: user.server || "ENGLISH #1",
    inGameId: user.inGameId || "",
    badgeNumber: user.badgeNumber || "",
    pinnedCommands: user.pinnedCommands || [],
    pinnedGroups: user.pinnedGroups || [],
    approvalStatus: user.approvalStatus || "not_submitted",
    inGameScreenshotUrl: user.inGameScreenshotUrl || null,
    createdAt: user.createdAt?.toISOString?.() || user.createdAt,
    updatedAt: user.updatedAt?.toISOString?.() || user.updatedAt,
  };

  if (token) payload.token = token;
  return payload;
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = { serializeUser, parseJsonField };
