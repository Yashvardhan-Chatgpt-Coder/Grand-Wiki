const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getJwtSecret() {
  return process.env.JWT_SECRET || "grandwiki_secure_jwt_secret_key_2026_forever";
}

function signToken(userId) {
  // 36500d = 100 years (login never expires)
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "36500d" });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

module.exports = { signToken, requireAuth, requireAdmin };
