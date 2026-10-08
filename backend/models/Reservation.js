const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    // Shared reservation ID
    reservationId: {
      type: String,
      required: true,
      trim: true,
    },

    // Member 1 fields
    resourceType: {
      type: String,
      enum: ["book", "seat"],
      required: true,
    },

    patronId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },

    readingRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingRoom",
    },

    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
    },

    pickupDate: {
      type: Date,
    },

    pickupTime: {
      type: String,
      trim: true,
    },

    pickupLocation: {
      type: String,
      trim: true,
    },

    seatStartAt: {
      type: Date,
    },

    seatEndAt: {
      type: Date,
    },

    holdExpiresAt: {
      type: Date,
    },

    activeBookKey: {
      type: String,
      select: false,
    },

    // Member 3 staff fields
    type: {
      type: String,
      enum: ["Book", "Seat"],
    },

    studentId: {
      type: String,
      trim: true,
    },

    studentName: {
      type: String,
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
      default: "",
    },

    timeSlot: {
      type: String,
      default: "",
    },

    // Supports Member 1 lowercase + Member 3 uppercase statuses
    status: {
      type: String,
      enum: [
        "confirmed",
        "cancelled",
        "completed",
        "expired",
        "CONFIRMED",
        "READY_FOR_PICKUP",
        "EXCEPTION",
        "CANCELLED",
        "NO_SHOW",
        "COMPLETED",
        "REJECTED",
      ],
      default: "confirmed",
      required: true,
    },

    requiresAttention: {
      type: Boolean,
      default: false,
    },

    attentionType: {
      type: String,
      enum: [
        "NONE",
        "PENDING_REVIEW",
        "DAMAGED_REPORT",
        "OVERDUE",
        "EXCEPTION",
      ],
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

// Member 1 validation
reservationSchema.pre("validate", function validateResource() {
  if (
    this.resourceType === "book" &&
    (!this.bookId ||
      !this.pickupDate ||
      !this.pickupLocation ||
      !this.pickupTime)
  ) {
    this.invalidate(
      "bookId",
      "Book reservations require a book, pickup date, pickup time, and pickup location."
    );
  }

  if (
    this.resourceType === "book" &&
    this.pickupTime &&
    !/^([01]?\d|2[0-3]):[0-5]\d$/.test(this.pickupTime)
  ) {
    this.invalidate(
      "pickupTime",
      "Reservation pickup time must use the HH:MM format."
    );
  }

  if (
    this.resourceType === "seat" &&
    (!this.readingRoomId ||
      !this.seatId ||
      !this.seatStartAt ||
      !this.seatEndAt)
  ) {
    this.invalidate(
      "seatId",
      "Seat reservations require a room, seat, and time range."
    );
  }

  if (
    this.resourceType === "seat" &&
    this.seatStartAt &&
    this.seatEndAt &&
    this.seatEndAt <= this.seatStartAt
  ) {
    this.invalidate(
      "seatEndAt",
      "The seat reservation end time must be after its start time."
    );
  }
});

reservationSchema.index(
  { activeBookKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      activeBookKey: { $type: "string" },
    },
  }
);

reservationSchema.index(
  { reservationId: 1 },
  { unique: true }
);

reservationSchema.index({
  patronId: 1,
  resourceType: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);