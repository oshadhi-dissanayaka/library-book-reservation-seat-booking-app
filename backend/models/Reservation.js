// ============================================================
// Reservation model (WF-11 Seat Reservation)
// IT3060 HCI Milestone 03
//
// One document = one seat held in one reading room for one
// date + time block. There is intentionally NO payment and NO
// authentication yet: studentId is a simple string placeholder.
// ============================================================

const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    // Which reading room the seat belongs to
    readingRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingRoom",
      required: [true, "Reading room is required"],
    },

    // Booking day, stored as "YYYY-MM-DD" (e.g. "2026-10-16")
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },

    // Time block chosen on the seat grid (e.g. "10:00 AM")
    time: {
      type: String,
      required: [true, "Time is required"],
      trim: true,
      maxlength: [30, "Time is too long"],
    },

    // Seat number inside that room (e.g. 7)
    seatNumber: {
      type: Number,
      required: [true, "Seat number is required"],
      min: [1, "Seat number must be a positive integer"],
      validate: {
        validator: Number.isInteger,
        message: "Seat number must be a positive integer",
      },
    },

    // Only two states for now
    status: {
      type: String,
      enum: {
        values: ["active", "cancelled"],
        message: "Status must be active or cancelled",
      },
      default: "active",
    },

    // Placeholder owner (no login system in this milestone)
    studentId: {
      type: String,
      default: "demo-student",
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt

    // IMPORTANT: seat bookings live in their OWN collection so they never
    // touch the book-reservation documents (and unique indexes) another
    // team member keeps in the shared "reservations" collection.
    collection: "seatreservations",
  }
);

// ------------------------------------------------------------
// Uniqueness rule:
// The same seat cannot be held twice for the same
// readingRoom + date + time AS LONG AS the existing booking is
// "active". A cancelled booking no longer blocks the seat, so
// the index only applies to active documents
// (partialFilterExpression).
// ------------------------------------------------------------
reservationSchema.index(
  { readingRoom: 1, date: 1, time: 1, seatNumber: 1 },
  {
    unique: true,
    name: "uniq_active_seat_per_slot",
    partialFilterExpression: { status: "active" },
  }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
