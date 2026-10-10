const jwt = require("jsonwebtoken");
const UserAccount = require("../models/UserAccount");

/**
 * Minimal JWT authentication (HCI assignment scale - no refresh tokens).
 *
 * Secret: MUST come from the environment (backend/.env -> JWT_SECRET).
 * There is intentionally no fallback secret - if it is missing the auth
 * endpoints fail loudly instead of signing tokens with a guessable value.
 */

const TOKEN_TTL = "12h";

function getJwtSecret() {
  const secret = (process.env.JWT_SECRET || "").trim();
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured. Add JWT_SECRET to backend/.env (see backend/.env.example)."
    );
  }
  return secret;
}

/** Signs a short-lived access token for an authenticated user. */
function signToken(user) {
  return jwt.sign(
    { sub: user.institutionalId, role: user.role },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL }
  );
}

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

/**
 * requireAuth - validates `Authorization: Bearer <jwt>` and loads the live
 * account (so deactivated users lose access immediately, not at token expiry).
 */
async function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch {
      return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
    }

    const institutionalId = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!institutionalId) {
      return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
    }

    const account = await UserAccount.findOne({ institutionalId });
    if (!account) {
      return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
    }
    if (!account.active) {
      return res.status(403).json({ message: "This account is inactive. Contact University Management." });
    }

    req.user = account;
    return next();
  } catch (error) {
    return next(error);
  }
}

/** requireRole("management") - authorization layer for sensitive routes. */
function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole };
