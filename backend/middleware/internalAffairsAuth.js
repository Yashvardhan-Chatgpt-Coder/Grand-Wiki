const jwt = require("jsonwebtoken");
const { getInternalAffairsModels } = require("../models/internalAffairs");

function getSecret() {
  const secret = process.env.IA_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("IA_JWT_SECRET or JWT_SECRET must be configured.");
  return secret;
}

function signInternalAffairsToken(user) {
  // Internal Affairs sessions persist until the user explicitly signs out.
  return jwt.sign({ iaUserId: user._id.toString(), scope: "internal-affairs" }, getSecret());
}

async function requireInternalAffairsAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Internal Affairs authentication is required." });

    let payload;
    try {
      payload = jwt.verify(token, getSecret());
    } catch (error) {
      // Tokens issued before the persistent-session change may carry the old
      // expiry. Validate their claims and transparently replace them.
      if (error.name !== "TokenExpiredError") throw error;
      payload = jwt.decode(token);
      if (!payload?.iaUserId || payload.scope !== "internal-affairs") throw error;
      res.setHeader("X-IA-Token", signInternalAffairsToken({ _id: payload.iaUserId }));
    }
    if (payload.scope !== "internal-affairs" || !payload.iaUserId) {
      return res.status(401).json({ message: "Invalid Internal Affairs session." });
    }

    const { IaUser } = await getInternalAffairsModels();
    const user = await IaUser.findById(payload.iaUserId);
    if (!user) return res.status(401).json({ message: "Your account is no longer available." });
    if (res.getHeader("X-IA-Token")) {
      res.setHeader("X-IA-Token", signInternalAffairsToken(user));
    }
    req.iaUser = user;
    next();
  } catch {
    return res.status(401).json({ message: "Your Internal Affairs session has expired. Please sign in again." });
  }
}

function requireInternalAffairsAdmin(req, res, next) {
  if (!req.iaUser?.isAdmin) return res.status(403).json({ message: "Administrator access is required." });
  next();
}

module.exports = { signInternalAffairsToken, requireInternalAffairsAuth, requireInternalAffairsAdmin };
