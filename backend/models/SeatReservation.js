const mongoose = require("mongoose");

const seatReservationSchema = new mongoose.Schema(
  {
    readingRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingRoom",
      required: [true, "Reading room is required"],
    },

    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },

    time: {
      type: String,
      required: [true, "Time is required"],
      trim: true,
      maxlength: [30, "Time is too long"],
    },

    seatNumber: {
      type: Number,
      required: [true, "Seat number is required"],
      min: [1, "Seat number must be a positive integer"],
      validate: {
        validator: Number.isInteger,
        message: "Seat number must be a positive integer",
      },
    },

    status: {
      type: String,
      enum: {
        values: ["active", "cancelled"],
        message: "Status must be active or cancelled",
      },
      default: "active",
    },

    studentId: {
      type: String,
      default: "demo-student",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "seatreservations",
  }
);

// Prevent the same seat from being booked twice
// for the same room, date and time.
seatReservationSchema.index(
  { readingRoom: 1, date: 1, time: 1, seatNumber: 1 },
  {
    unique: true,
    name: "uniq_active_seat_per_slot",
    partialFilterExpression: { status: "active" },
  }
);

const SeatReservation =
  mongoose.models.SeatReservation ||
  mongoose.model("SeatReservation", seatReservationSchema);

module.exports = SeatReservation;