const express = require("express");

const {
  signup,
  login,
  me,
  getIdentity,
  changePassword,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Self-signup (student + academic staff, validated against ApprovedIdentity)
router.post("/signup", signup);

// Institutional ID + password login (all roles, role-checked per portal)
router.post("/login", login);

// Authenticated user lookup (never returns passwordHash)
router.get("/me", requireAuth, me);

// Public approved-identity lookup for the signup form (name/email auto-fill)
router.get("/identity/:institutionalId", getIdentity);

// First-login / any-time password change
router.post("/change-password", requireAuth, changePassword);

module.exports = router;
