const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      default: "Reading Room A",
    },
    floor: {
      type: String,
      default: "Floor 02",
    },
    wing: {
      type: String,
      default: "West Wing",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance"],
      default: "available",
    },
    occupiedBy: {
      studentId: { type: String, default: "" },
      studentName: { type: String, default: "" },
      reservationId: { type: String, default: "" },
      startTime: { type: String, default: "" },
      endTime: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    collection: "seats",
  }
);

module.exports = mongoose.models.Seat || mongoose.model("Seat", seatSchema);
