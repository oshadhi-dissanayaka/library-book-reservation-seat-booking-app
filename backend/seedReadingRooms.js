/**
 * Development seed for WF-09 Reading Room Search (IT3060 HCI Milestone 03).
 *
 * Usage:  node backend/seedReadingRooms.js   (from the repository root)
 *    or:  node seedReadingRooms.js           (from inside backend/)
 *
 * DEV/SAMPLE DATA ONLY — these documents are example reading rooms for local
 * development and demos. They are not production data.
 *
 * The script is idempotent: rooms are matched on name + building + floor.
 * Existing rooms receive the current operating hours; missing seed rooms are
 * inserted without creating duplicates.
 */

// Load backend/.env regardless of the folder the script is run from.
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const ReadingRoom = require("./models/ReadingRoom");

// --- DEV/SAMPLE DATA -------------------------------------------------------
const developmentReadingRooms = [
  {
    name: "Reading Room A",
    building: "East Wing",
    floor: "2",
    zone: "Deep Silent Zone",
    description:
      "Silent individual study desks with power outlets and high-speed Eduroam.",
    totalSeats: 24,
    openingTime: "08:00",
    closingTime: "18:30",
    status: "active",
  },
  {
    name: "Reading Room B",
    building: "East Wing",
    floor: "1",
    zone: "Quiet Study Zone",
    description:
      "Window-side desks for quiet reading, suitable for group-free study.",
    totalSeats: 32,
    openingTime: "08:00",
    closingTime: "18:30",
    status: "active",
  },
  {
    name: "Reading Room C",
    building: "Central Library",
    floor: "3",
    zone: "Collaborative Zone",
    description:
      "Open-plan reading room with movable desks for discussion-based study.",
    totalSeats: 40,
    openingTime: "08:00",
    closingTime: "18:30",
    status: "active",
  },
];
// --------------------------------------------------------------------------

async function seedReadingRooms() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Check backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected — seeding development reading rooms...");

    let inserted = 0;
    let updated = 0;

    for (const room of developmentReadingRooms) {
      const { openingTime, closingTime, ...roomOnInsert } = room;
      const result = await ReadingRoom.updateOne(
        { name: room.name, building: room.building, floor: room.floor },
        {
          $set: { openingTime, closingTime },
          $setOnInsert: roomOnInsert,
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted += 1;
        console.log(`  inserted: ${room.name} (${room.building}, Floor ${room.floor})`);
      } else {
        updated += 1;
        console.log(`  hours updated: ${room.name}`);
      }
    }

    console.log(`Seed finished — inserted: ${inserted}, hours updated: ${updated}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

seedReadingRooms();
