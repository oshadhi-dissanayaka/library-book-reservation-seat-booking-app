const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    reservationId: { type: String, required: true, trim: true },
    resourceType: {
      type: String,
      enum: ["book", "seat"],
      required: true,
    },
    patronId: { type: String, required: true, trim: true, uppercase: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
    readingRoomId: { type: mongoose.Schema.Types.ObjectId, ref: "ReadingRoom" },
    seatId: { type: mongoose.Schema.Types.ObjectId, ref: "Seat" },
    pickupDate: { type: Date },
    pickupTime: { type: String, trim: true },
    pickupLocation: { type: String, trim: true },
    seatStartAt: { type: Date },
    seatEndAt: { type: Date },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed", "expired"],
      default: "confirmed",
      required: true,
    },
    holdExpiresAt: { type: Date },
    activeBookKey: { type: String, select: false },
  },
  { timestamps: true }
);

reservationSchema.pre("validate", function validateResource() {
  if (this.resourceType === "book" && (!this.bookId || !this.pickupDate || !this.pickupLocation || !this.pickupTime)) {
    this.invalidate("bookId", "Book reservations require a book, pickup date, pickup time, and pickup location.");
  }

  if (this.resourceType === "book" && this.pickupTime && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(this.pickupTime)) {
    this.invalidate("pickupTime", "Reservation pickup time must use the HH:MM format.");
  }

  if (
    this.resourceType === "seat" &&
    (!this.readingRoomId || !this.seatId || !this.seatStartAt || !this.seatEndAt)
  ) {
    this.invalidate("seatId", "Seat reservations require a room, seat, and time range.");
  }

  if (
    this.resourceType === "seat" &&
    this.seatStartAt &&
    this.seatEndAt &&
    this.seatEndAt <= this.seatStartAt
  ) {
    this.invalidate("seatEndAt", "The seat reservation end time must be after its start time.");
  }
});

reservationSchema.index(
  { activeBookKey: 1 },
  {
    unique: true,
    partialFilterExpression: { activeBookKey: { $type: "string" } },
  }
);
reservationSchema.index({ reservationId: 1 }, { unique: true });
reservationSchema.index({ patronId: 1, resourceType: 1, createdAt: -1 });

module.exports =
  mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);