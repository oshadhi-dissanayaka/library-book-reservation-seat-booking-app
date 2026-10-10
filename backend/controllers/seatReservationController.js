const mongoose = require("mongoose");
const Reservation = require("../models/SeatReservation");
const ReadingRoom = require("../models/ReadingRoom");

const SEAT_TAKEN_MESSAGE =
  "This seat is no longer available. Please select another seat.";

// Fallback owner used only when a request does not carry a studentId.
// The frontend always sends its centralized identity (see
// frontend/src/lib/student-identity.ts); this keeps the API usable on its own.
const DEFAULT_STUDENT_ID = process.env.DEV_STUDENT_ID || "demo-student";

const BLOCK_MINUTES = 120;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toMinutesSinceMidnight(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function formatBlockEdge(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour >= 12 ? "PM" : "AM";

  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
}

function validTimeBlocksFor(room) {
  const open = toMinutesSinceMidnight(room.openingTime);
  const close = toMinutesSinceMidnight(room.closingTime);
  const blocks = [];

  for (
    let from = open;
    from + BLOCK_MINUTES <= close;
    from += BLOCK_MINUTES
  ) {
    blocks.push(
      `${formatBlockEdge(from)} – ${formatBlockEdge(from + BLOCK_MINUTES)}`
    );
  }

  return blocks;
}

/** "08:00 AM – 10:00 AM" -> 480 (start edge), or null when malformed. */
function blockStartMinutes(block) {
  const match = /^(\d{2}):(\d{2})\s(AM|PM)/.exec(block);
  if (!match) return null;

  const hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  const offset = match[3] === "PM" ? 12 * 60 : 0;

  return hour * 60 + minute + offset;
}

/** "2026-10-08" -> Date at local midnight, or null when not a real date. */
function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;

  const date = new Date(year, month - 1, day);

  // Rejects 2026-02-31 and friends.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Today's date as local "YYYY-MM-DD" (matches the stored format). */
function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function normalizeStudentId(value) {
  if (value === undefined || value === null) return DEFAULT_STUDENT_ID;
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "studentId must be a non-empty string" };
  }

  const trimmed = value.trim();
  if (trimmed.length > 64) {
    return { error: "studentId is too long" };
  }

  return trimmed;
}

/**
 * Shared validation for POST / and POST /batch.
 *
 * Returns { room, blocks } on success or { status, message } on failure.
 * Status codes: 400 invalid request, 404 room not found / inactive.
 */
async function validateSeatRequest({
  readingRoom,
  date,
  time,
  seatNumber,
  totalBlocks,
}) {
  const blocks = Array.isArray(time) ? time : [time];
  const expectedBlocks = totalBlocks || 1;

  if (!readingRoom || typeof readingRoom !== "string") {
    return { status: 400, message: "Reading room id is required" };
  }

  if (!mongoose.isValidObjectId(readingRoom)) {
    return { status: 400, message: "Invalid reading room id" };
  }

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { status: 400, message: "Date must be in YYYY-MM-DD format" };
  }

  const parsedDate = parseIsoDate(date);
  if (!parsedDate) {
    return { status: 400, message: "Date must be a valid calendar date" };
  }

  if (date < todayIso()) {
    return { status: 400, message: "Date cannot be in the past" };
  }

  if (blocks.length !== expectedBlocks) {
    return {
      status: 400,
      message: `Exactly ${expectedBlocks} time block(s) are required`,
    };
  }

  if (blocks.some((block) => typeof block !== "string" || block.trim() === "")) {
    return { status: 400, message: "Time is required" };
  }

  if (!Number.isInteger(seatNumber) || seatNumber < 1) {
    return { status: 400, message: "Seat number must be a positive integer" };
  }

  const room = await ReadingRoom.findById(readingRoom);

  if (!room) {
    return { status: 404, message: "Reading room not found" };
  }

  // Only rooms a student can actually book.
  if (room.status !== "active") {
    return {
      status: 400,
      message: "This reading room is not available for reservations",
    };
  }

  if (seatNumber > room.totalSeats) {
    return {
      status: 400,
      message: `Seat number must be between 1 and ${room.totalSeats}`,
    };
  }

  const normalizedBlocks = blocks.map((block) => block.trim());
  const validBlocks = validTimeBlocksFor(room);

  for (const block of normalizedBlocks) {
    if (!validBlocks.includes(block)) {
      return {
        status: 400,
        message:
          "Time must be a valid complete 2-hour block within reading room hours",
      };
    }

    // A block that already started today cannot be reserved.
    if (date === todayIso()) {
      const start = blockStartMinutes(block);
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      if (start !== null && start <= nowMinutes) {
        return {
          status: 400,
          message: "This time block has already started. Please pick a later block.",
        };
      }
    }
  }

  return { room, blocks: normalizedBlocks };
}

/**
 * Returns the conflicting seat numbers (1..totalSeats) for the given blocks.
 * Cancelled reservations never conflict — the unique index is partial on
 * status:"active" and the filter below matches that.
 */
async function findConflictingSeats({ readingRoom, date, blocks, seatNumber }) {
  const conflicts = await Reservation.find({
    readingRoom,
    date,
    time: { $in: blocks },
    seatNumber,
    status: "active",
  });

  return conflicts.length > 0;
}

// POST /api/seat-reservations
// Body: { studentId?, readingRoom, date, time, seatNumber }
const createReservation = async (req, res) => {
  try {
    const { readingRoom, date, time, seatNumber } = req.body;

    const studentId = normalizeStudentId(req.body.studentId);
    if (typeof studentId === "object" && studentId.error) {
      return res.status(400).json({ message: studentId.error });
    }

    const validation = await validateSeatRequest({
      readingRoom,
      date,
      time,
      seatNumber,
    });

    if (validation.status) {
      return res.status(validation.status).json({
        message: validation.message,
      });
    }

    const { room, blocks } = validation;
    const normalizedTime = blocks[0];

    if (await findConflictingSeats({ readingRoom, date, blocks, seatNumber })) {
      return res.status(409).json({
        message: SEAT_TAKEN_MESSAGE,
      });
    }

    const reservation = await Reservation.create({
      readingRoom,
      date,
      time: normalizedTime,
      seatNumber,
      status: "active",
      studentId,
    });

    const confirmationCode = `RES-SEAT-${String(reservation._id)
      .slice(-4)
      .toUpperCase()}`;

    return res.status(201).json({
      message: "Reservation created successfully",
      _id: reservation._id,
      readingRoom: reservation.readingRoom,
      date: reservation.date,
      time: reservation.time,
      seatNumber: reservation.seatNumber,
      status: reservation.status,
      studentId: reservation.studentId,
      createdAt: reservation.createdAt,
      confirmationCode,
      confirmationNote:
        "Please arrive within 15 minutes of your scheduled time.",
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        message: SEAT_TAKEN_MESSAGE,
      });
    }

    if (error && error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)[0].message;

      return res.status(400).json({
        message: firstMessage,
      });
    }

    console.error("Error creating reservation:", error);

    return res.status(500).json({
      message: "Could not save the reservation. Please try again.",
    });
  }
};

// POST /api/seat-reservations/batch
// Body: { studentId?, readingRoom, date, blocks: string[], seatNumber }
//
// Multi-block booking with NO partial writes:
//   1. validate every requested block first (room, seat, date, time, hours)
//   2. reject the whole request with 409 if any block conflicts
//   3. create every record, rolling back the ones already created if a
//      later insert fails (e.g. a race on the unique index)
const createReservationBatch = async (req, res) => {
  const createdIds = [];

  try {
    const { readingRoom, date, seatNumber } = req.body;
    const blocks = Array.isArray(req.body.blocks) ? req.body.blocks : null;

    const studentId = normalizeStudentId(req.body.studentId);
    if (typeof studentId === "object" && studentId.error) {
      return res.status(400).json({ message: studentId.error });
    }

    if (!blocks || blocks.length === 0) {
      return res.status(400).json({
        message: "At least one time block is required",
      });
    }

    if (new Set(blocks).size !== blocks.length) {
      return res.status(400).json({
        message: "Time blocks must be unique",
      });
    }

    const validation = await validateSeatRequest({
      readingRoom,
      date,
      time: blocks,
      seatNumber,
      totalBlocks: blocks.length,
    });

    if (validation.status) {
      return res.status(validation.status).json({
        message: validation.message,
      });
    }

    const { blocks: normalizedBlocks } = validation;

    // Fail the WHOLE booking before writing anything if one block is taken.
    if (
      await findConflictingSeats({
        readingRoom,
        date,
        blocks: normalizedBlocks,
        seatNumber,
      })
    ) {
      return res.status(409).json({
        message: SEAT_TAKEN_MESSAGE,
      });
    }

    for (const block of normalizedBlocks) {
      const reservation = await Reservation.create({
        readingRoom,
        date,
        time: block,
        seatNumber,
        status: "active",
        studentId,
      });

      createdIds.push(reservation._id);
    }

    const confirmationCode = `RES-SEAT-${String(createdIds[0])
      .slice(-4)
      .toUpperCase()}`;

    return res.status(201).json({
      message: "Reservation created successfully",
      _id: createdIds[0],
      reservationIds: createdIds,
      blockCount: createdIds.length,
      readingRoom,
      date,
      time: normalizedBlocks.join(", "),
      seatNumber,
      status: "active",
      studentId,
      confirmationCode,
      confirmationNote:
        "Please arrive within 15 minutes of your scheduled time.",
    });
  } catch (error) {
    // Controlled rollback: drop anything already written so a failed
    // multi-block request never leaves a partial booking behind.
    if (createdIds.length > 0) {
      try {
        await Reservation.deleteMany({ _id: { $in: createdIds } });
      } catch (rollbackError) {
        console.error("Rollback failed for batch reservation:", rollbackError);
      }
    }

    if (error && error.code === 11000) {
      return res.status(409).json({
        message: SEAT_TAKEN_MESSAGE,
      });
    }

    if (error && error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)[0].message;

      return res.status(400).json({
        message: firstMessage,
      });
    }

    console.error("Error creating batch reservation:", error);

    return res.status(500).json({
      message: "Could not save the reservation. Please try again.",
    });
  }
};

// GET /api/seat-reservations
//   ?studentId=...  -> only that student's reservations (WF-13/14/15)
//   ?readingRoom=...&date=...&time=...  -> occupancy for the seat map (WF-10)
//   ?status=active|cancelled  -> optional status filter
//
// With NO studentId the list is global on purpose: a seat is occupied by
// ANY student's active reservation, so the availability map must see them all.
const getReservations = async (req, res) => {
  try {
    const { readingRoom, date, time, status, studentId } = req.query;

    const filter = {};

    if (studentId !== undefined) {
      const normalized = normalizeStudentId(studentId);
      if (typeof normalized === "object" && normalized.error) {
        return res.status(400).json({ message: normalized.error });
      }

      filter.studentId = normalized;
    }

    if (readingRoom) {
      if (!mongoose.isValidObjectId(readingRoom)) {
        return res.status(400).json({
          message: "Invalid reading room id",
        });
      }

      filter.readingRoom = readingRoom;
    }

    if (date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          message: "Date must be in YYYY-MM-DD format",
        });
      }

      filter.date = date;
    }

    if (time !== undefined) {
      if (typeof time !== "string" || time.trim() === "") {
        return res.status(400).json({
          message: "Time must be a non-empty string",
        });
      }

      filter.time = time.trim();
    }

    if (status !== undefined) {
      if (status !== "active" && status !== "cancelled") {
        return res.status(400).json({
          message: "Status must be active or cancelled",
        });
      }

      filter.status = status;
    }

    const reservations = await Reservation.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);

    return res.status(500).json({
      message: "Could not load reservations. Please try again.",
    });
  }
};

// GET /api/seat-reservations/:id
// ?studentId=... optionally enforces ownership (403 when it is not yours).
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid reservation id",
      });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (req.query.studentId !== undefined) {
      const normalized = normalizeStudentId(req.query.studentId);
      if (typeof normalized === "object" && normalized.error) {
        return res.status(400).json({ message: normalized.error });
      }

      if (reservation.studentId !== normalized) {
        return res.status(403).json({
          message: "This reservation belongs to another student",
        });
      }
    }

    const confirmationCode = `RES-SEAT-${String(reservation._id)
      .slice(-4)
      .toUpperCase()}`;

    return res.status(200).json({
      reservation,
      confirmationCode,
    });
  } catch (error) {
    console.error("Error fetching reservation:", error);

    return res.status(500).json({
      message: "Could not load the reservation. Please try again.",
    });
  }
};

// PATCH /api/seat-reservations/:id/cancel
// ?studentId=... enforces ownership; the seat is freed for other students
// because the unique index only covers status:"active".
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid reservation id",
      });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (req.body.studentId !== undefined) {
      const normalized = normalizeStudentId(req.body.studentId);
      if (typeof normalized === "object" && normalized.error) {
        return res.status(400).json({ message: normalized.error });
      }

      if (reservation.studentId !== normalized) {
        return res.status(403).json({
          message: "This reservation belongs to another student",
        });
      }
    }

    if (reservation.status === "cancelled") {
      return res.status(409).json({
        message: "This reservation is already cancelled",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    const confirmationCode = `RES-SEAT-${String(reservation._id)
      .slice(-4)
      .toUpperCase()}`;

    return res.status(200).json({
      message: "Reservation cancelled",
      reservation,
      confirmationCode,
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);

    return res.status(500).json({
      message: "Could not cancel the reservation. Please try again.",
    });
  }
};

module.exports = {
  createReservation,
  createReservationBatch,
  getReservations,
  getReservationById,
  cancelReservation,
};
