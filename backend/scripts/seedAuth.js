/**
 * Idempotent authentication seed.
 *
 *   node scripts/seedAuth.js      (or: npm run seed:auth)
 *
 * What it does:
 *   1. ApprovedIdentity entries for the approved students + academic staff
 *      (used to validate self-signup). Inserted with $setOnInsert only, so
 *      reruns never duplicate rows and never undo a completed registration.
 *   2. Real login accounts (hashed passwords) for the seeded privileged
 *      accounts:
 *        - LIB001  library_staff  (demo password, mustChangePassword: true)
 *        - MGT001  management     (demo password, mustChangePassword: true)
 *      Existing accounts are NEVER touched - rerunning does not reset a
 *      password a user has changed.
 *
 * Students / academic staff get NO login account here; they must self-signup.
 *
 * DEMO PASSWORDS (development only, always bcrypt-hashed before storage):
 *   LIB001  -> env LIBRARY_STAFF_DEMO_PASSWORD or default "Mihan123"
 *   MGT001  -> env MANAGEMENT_DEMO_PASSWORD  or default "Oshadi123"
 * Plaintext passwords are never written to MongoDB.
 */
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
  quiet: true,
});

const ApprovedIdentity = require("../models/ApprovedIdentity");
const UserAccount = require("../models/UserAccount");

const BCRYPT_ROUNDS = 10;

const APPROVED_IDENTITIES = [
  {
    institutionalId: "IT23846586",
    email: "nimesh@sliit.lk",
    name: "Nimesh",
    role: "student",
  },
  {
    institutionalId: "IT23844056",
    email: "ridmi@sliit.lk",
    name: "Ridmi",
    role: "student",
  },
  {
    institutionalId: "AC001",
    email: "academic1@sliit.lk",
    name: "Academic Staff 001",
    role: "academic_staff",
  },
  {
    institutionalId: "AC002",
    email: "academic2@sliit.lk",
    name: "Academic Staff 002",
    role: "academic_staff",
  },
];

// Privileged accounts that DO get a login credential from the seed.
const SEEDED_ACCOUNTS = [
  {
    institutionalId: "LIB001",
    email: "mihan@sliit.lk",
    name: "Mihan",
    role: "library_staff",
    password: process.env.LIBRARY_STAFF_DEMO_PASSWORD || "Mihan123",
  },
  {
    institutionalId: "MGT001",
    email: "oshadi@sliit.lk",
    name: "Oshadi",
    role: "management",
    password: process.env.MANAGEMENT_DEMO_PASSWORD || "Oshadi123",
  },
];

async function seedApprovedIdentities() {
  let created = 0;
  for (const identity of APPROVED_IDENTITIES) {
    const result = await ApprovedIdentity.updateOne(
      { institutionalId: identity.institutionalId },
      {
        $setOnInsert: {
          ...identity,
          active: true,
          registered: false,
          registeredAt: null,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }
  console.log(
    `ApprovedIdentity: ${created} created, ${
      APPROVED_IDENTITIES.length - created
    } already present (unchanged).`
  );
}

async function seedAccounts() {
  let created = 0;
  let skipped = 0;
  for (const account of SEEDED_ACCOUNTS) {
    const existing = await UserAccount.findOne({
      institutionalId: account.institutionalId,
    });
    if (existing) {
      // Idempotent: never reset a password the owner may have changed.
      skipped += 1;
      continue;
    }

    const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);
    await UserAccount.create({
      institutionalId: account.institutionalId,
      email: account.email,
      name: account.name,
      role: account.role,
      passwordHash,
      active: true,
      mustChangePassword: true,
    });
    created += 1;
  }
  console.log(`UserAccount: ${created} created, ${skipped} already present (unchanged).`);
}

async function main() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error("MONGO_URI is missing. Add it to backend/.env.");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected.");

  await seedApprovedIdentities();
  await seedAccounts();

  console.log("Auth seed complete.");
}

main()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error(`Auth seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
