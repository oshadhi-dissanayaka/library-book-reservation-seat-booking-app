const mongoose = require("mongoose");

/**
 * Approved university identity.
 *
 * An ApprovedIdentity is "someone the university has approved to own a login
 * account" (students + academic staff self-register against it). It holds NO
 * credentials - the login credential lives in UserAccount, so an approved
 * identity that never signed up still has no password at all.
 *
 * Seeded by scripts/seedAuth.js (idempotent).
 */
const approvedIdentitySchema = new mongoose.Schema(
  {
    institutionalId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "academic_staff"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Flipped to true by POST /api/auth/signup once the identity has a login.
    registered: {
      type: Boolean,
      default: false,
    },
    registeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovedIdentity", approvedIdentitySchema);
