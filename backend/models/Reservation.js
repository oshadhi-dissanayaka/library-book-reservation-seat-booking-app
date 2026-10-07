const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Book", "Seat"],
      default: "Book",
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentProgram: {
      type: String,
      default: "BSc (Hons) in Information Technology",
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },
    bookTitle: {
      type: String,
      default: "",
    },
    bookSubtitle: {
      type: String,
      default: "",
    },
    bookAuthor: {
      type: String,
      default: "",
    },
    bookEdition: {
      type: String,
      default: "",
    },
    bookShelf: {
      type: String,
      default: "",
    },
    pickupDate: {
      type: String,
      default: "",
    },
    pickupLocation: {
      type: String,
      default: "Main Library - Circulation Desk 01",
    },
    loanDuration: {
      type: String,
      default: "14 Days",
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      default: null,
    },
    seatNumber: {
      type: String,
      default: "",
    },
    room: {
      type: String,
      default: "Reading Room A",
    },
    timeSlot: {
      type: String,
      default: "10:00 AM - 12:00 PM",
    },
    status: {
      type: String,
      enum: [
        "CONFIRMED",
        "READY_FOR_PICKUP",
        "EXCEPTION",
        "CANCELLED",
        "NO_SHOW",
        "COMPLETED",
        "REJECTED",
      ],
      default: "CONFIRMED",
    },
    requiresAttention: {
      type: Boolean,
      default: false,
    },
    attentionType: {
      type: String,
      enum: ["NONE", "PENDING_REVIEW", "DAMAGED_REPORT", "OVERDUE", "EXCEPTION"],
      default: "NONE",
    },
    attentionReason: {
      type: String,
      default: "",
    },
    deskNote: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    rejectionExplanation: {
      type: String,
      default: "",
    },
    rejectionStaffId: {
      type: String,
      default: "",
    },
    rejectionDate: {
      type: Date,
      default: null,
    },
    cancellationSource: {
      type: String,
      enum: ["NONE", "STUDENT_PORTAL", "STAFF_ACTION", "SYSTEM_AUTO"],
      default: "NONE",
    },
    noShowRecordedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "reservations",
  }
);

module.exports =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);
