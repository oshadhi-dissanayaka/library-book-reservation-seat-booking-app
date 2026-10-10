const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const ApprovedIdentity = require("../models/ApprovedIdentity");
const UserAccount = require("../models/UserAccount");
const { signToken } = require("../middleware/auth");

// bcrypt cost - 10 is a good balance for a student project server.
const BCRYPT_ROUNDS = 10;

// Only these roles may self-sign-up; library staff / management are issued.
const SELF_SIGNUP_ROLES = ["student", "academic_staff"];

const PASSWORD_MIN_LENGTH = 8;

function normalizeInstitutionalId(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function passwordPolicyError(password) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain both letters and numbers.";
  }
  return null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function sessionPayload(user, mustChangePassword) {
  return {
    token: signToken(user),
    user: {
      institutionalId: user.institutionalId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    mustChangePassword: Boolean(mustChangePassword ?? user.mustChangePassword),
  };
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup  (student + academic staff only)
// ---------------------------------------------------------------------------
const signup = async (req, res) => {
  try {
    const institutionalId = normalizeInstitutionalId(req.body.institutionalId);
    const email = normalizeEmail(req.body.email);
    const role = String(req.body.role || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(
      req.body.confirmPassword ?? req.body.confirmPasswordConfirm ?? req.body.confirm ?? ""
    );

    if (!institutionalId || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Institutional ID, university email, password and confirm password are required.",
      });
    }

    if (!SELF_SIGNUP_ROLES.includes(role)) {
      return res.status(403).json({
        message: "Only Student and Academic Staff accounts can sign up here.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const policyError = passwordPolicyError(password);
    if (policyError) {
      return res.status(400).json({ message: policyError });
    }

    const identity = await ApprovedIdentity.findOne({ institutionalId });
    if (!identity) {
      return res.status(400).json({ message: "Institutional ID not recognized." });
    }
    if (!identity.active) {
      return res.status(403).json({
        message: "This institutional ID is inactive. Contact your university.",
      });
    }
    if (identity.role !== role) {
      return res.status(400).json({
        message: "Selected role does not match this institutional ID.",
      });
    }
    if (identity.email !== email) {
      return res.status(400).json({
        message: "University email does not match this institutional ID.",
      });
    }
    if (identity.registered) {
      return res.status(409).json({ message: "This institutional ID is already registered." });
    }

    const existing = await UserAccount.findOne({
      $or: [{ institutionalId }, { email }],
    });
    if (existing) {
      return res.status(409).json({ message: "This institutional ID is already registered." });
    }

    const passwordHash = await hashPassword(password);
    const account = await UserAccount.create({
      institutionalId,
      email,
      name: identity.name,
      role: identity.role,
      passwordHash,
      active: true,
      mustChangePassword: false,
    });

    await ApprovedIdentity.updateOne(
      { _id: identity._id },
      { $set: { registered: true, registeredAt: new Date() } }
    );

    return res.status(201).json(sessionPayload(account));
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "This institutional ID is already registered." });
    }
    return res.status(500).json({ message: "Signup failed. Please try again." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
const login = async (req, res) => {
  try {
    const institutionalId = normalizeInstitutionalId(
      req.body.institutionalId ?? req.body.username ?? req.body.staffId
    );
    const password = String(req.body.password || "");
    const requestedRole = String(req.body.role || "").trim();

    if (!institutionalId || !password) {
      return res.status(400).json({ message: "Institutional ID and password are required." });
    }

    const account = await UserAccount.findOne({ institutionalId }).select("+passwordHash");
    // Same message for "no such user" and "wrong password" - never leak which.
    if (!account) {
      return res.status(401).json({ message: "Invalid institutional ID or password." });
    }

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid institutional ID or password." });
    }

    if (!account.active) {
      return res.status(403).json({
        message: "This account is inactive. Contact University Management.",
      });
    }

    if (requestedRole && requestedRole !== account.role) {
      return res.status(403).json({
        message: "This account does not match the selected portal.",
      });
    }

    return res.status(200).json(sessionPayload(account));
  } catch (error) {
    if (error && error.message && error.message.indexOf("JWT_SECRET") !== -1) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me  (authenticated user lookup)
// ---------------------------------------------------------------------------
const me = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user.toSafeObject() });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load the current user." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/identity/:institutionalId
// Public directory lookup used by the signup form to auto-fill the assigned
// university email + name. Returns identity data only - never credentials.
// ---------------------------------------------------------------------------
const getIdentity = async (req, res) => {
  try {
    const institutionalId = normalizeInstitutionalId(req.params.institutionalId);
    if (!institutionalId) {
      return res.status(400).json({ message: "Institutional ID is required." });
    }

    const identity = await ApprovedIdentity.findOne({ institutionalId });
    if (!identity) {
      return res.status(404).json({ message: "Institutional ID not recognized." });
    }

    return res.status(200).json({
      identity: {
        institutionalId: identity.institutionalId,
        name: identity.name,
        email: identity.email,
        role: identity.role,
        active: identity.active,
        registered: identity.registered,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to look up this institutional ID." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/change-password  (supports seeded mustChangePassword accounts)
// ---------------------------------------------------------------------------
const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password and confirm password are required.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      return res.status(400).json({ message: policyError });
    }

    const account = await UserAccount.findOne({ institutionalId: req.user.institutionalId }).select(
      "+passwordHash"
    );
    if (!account) {
      return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
    }

    const valid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    account.passwordHash = await hashPassword(newPassword);
    account.mustChangePassword = false;
    await account.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update the password." });
  }
};

// Used by the management staff-creation flow when no temporary password is
// supplied. Returns a one-time temporary password (never stored in plain text).
function generateTemporaryPassword() {
  const random = crypto.randomBytes(6).toString("base64url");
  return `Tmp${random}${crypto.randomInt(10, 99)}`;
}

module.exports = {
  signup,
  login,
  me,
  getIdentity,
  changePassword,
  hashPassword,
  passwordPolicyError,
  generateTemporaryPassword,
};
