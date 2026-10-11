const mongoose = require("mongoose");

/**
 * Login account / credential (the ONLY place a password hash lives).
 *
 * Kept separate from ApprovedIdentity so that:
 *   - students/academic staff self-signup against an approved identity,
 *   - library staff and management accounts are created by seed/management,
 *   - no collection other than this one ever touches credentials.
 *
 * `passwordHash` is `select: false` - it is never returned unless a controller
 * explicitly asks for it (login only), so it cannot leak through a normal query.
 */
const userAccountSchema = new mongoose.Schema(
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
      enum: ["student", "academic_staff", "library_staff", "management"],
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/** Public projection - never includes passwordHash. */
userAccountSchema.methods.toSafeObject = function toSafeObject() {
  return {
    institutionalId: this.institutionalId,
    email: this.email,
    name: this.name,
    role: this.role,
    active: this.active,
    mustChangePassword: this.mustChangePassword,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("UserAccount", userAccountSchema);
