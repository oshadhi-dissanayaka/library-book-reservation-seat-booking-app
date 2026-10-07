// ============================================================
// Reservation controller (WF-11 Seat Reservation)
// IT3060 HCI Milestone 03
//
// Endpoints:
//   POST /api/reservations  -> create a seat reservation
//   GET  /api/reservations  -> list demo-student reservations
//                              (optional filters: readingRoom,
//                               date, time — used by WF-10 to
//                               know which seats are taken)
// ============================================================

const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const ReadingRoom = require("../models/ReadingRoom");

// Shown whenever a seat is already taken
const SEAT_TAKEN_MESSAGE = "This seat is no longer available. Please select another seat.";

// ------------------------------------------------------------
// POST /api/reservations
// Body: { readingRoom, date, time, seatNumber }
// ------------------------------------------------------------
const createReservation = async (req, res) => {
  try {
    const { readingRoom, date, time, seatNumber } = req.body;

    // --- basic validation (clear, beginner-friendly checks) ---
    if (!readingRoom || typeof readingRoom !== "string") {
      return res.status(400).json({ message: "Reading room id is required" });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format" });
    }
    if (!time || typeof time !== "string" || time.trim() === "") {
      return res.status(400).json({ message: "Time is required" });
    }
    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      return res.status(400).json({ message: "Seat number must be a positive integer" });
    }
    if (!mongoose.isValidObjectId(readingRoom)) {
      return res.status(400).json({ message: "Invalid reading room id" });
    }

    // --- the room must exist ---
    const room = await ReadingRoom.findById(readingRoom);
    if (!room) {
      return res.status(404).json({ message: "Reading room not found" });
    }

    // --- reject a seat that is already held (friendly pre-check) ---
    const existing = await Reservation.findOne({
      readingRoom,
      date,
      time: time.trim(),
      seatNumber,
      status: "active",
    });
    if (existing) {
      return res.status(409).json({ message: SEAT_TAKEN_MESSAGE });
    }

    // --- create the reservation ---
    const reservation = await Reservation.create({
      readingRoom,
      date,
      time: time.trim(),
      seatNumber,
      status: "active",
      studentId: "demo-student",
    });

    // Simple reference code for the confirmation screen (WF-12)
    const confirmationCode = `RES-SEAT-${String(reservation._id).slice(-4).toUpperCase()}`;

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
      confirmationNote: "Please arrive within 15 minutes of your scheduled time.",
    });
  } catch (error) {
    // Duplicate key (race condition) -> seat was taken at the exact moment
    if (error && error.code === 11000) {
      return res.status(409).json({ message: SEAT_TAKEN_MESSAGE });
    }
    if (error && error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)[0].message;
      return res.status(400).json({ message: firstMessage });
    }
    console.error("Error creating reservation:", error);
    return res.status(500).json({ message: "Could not save the reservation. Please try again." });
  }
};

// ------------------------------------------------------------
// GET /api/reservations
// Optional query filters: ?readingRoom=...&date=YYYY-MM-DD&time=10:00 AM
// For now every reservation belongs to the demo student.
// ------------------------------------------------------------
const getReservations = async (req, res) => {
  try {
    const { readingRoom, date, time } = req.query;

    const filter = { studentId: "demo-student" };

    if (readingRoom) {
      if (!mongoose.isValidObjectId(readingRoom)) {
        return res.status(400).json({ message: "Invalid reading room id" });
      }
      filter.readingRoom = readingRoom;
    }
    if (date) {
      filter.date = date;
    }
    if (time) {
      filter.time = time;
    }

    const reservations = await Reservation.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return res.status(500).json({ message: "Could not load reservations. Please try again." });
  }
};

module.exports = {
  createReservation,
  getReservations,
};
