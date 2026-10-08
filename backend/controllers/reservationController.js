const crypto = require("crypto");
const mongoose = require("mongoose");
const Book = require("../models/Book");
const Reservation = require("../models/Reservation");
const { releaseExpiredBookHolds } = require("../services/bookHoldService");

const normalizePatronId = (value) => String(value || "").trim().toUpperCase();

const parsePickupDate = (value) => {
  const dateOnly = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;

  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateOnly) return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const latest = new Date(today);
  latest.setUTCDate(latest.getUTCDate() + 6);

  if (date < today || date > latest) return null;
  return date;
};

const parsePickupTime = (value) => {
  const time = String(value || "").trim();
  if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return time;
};

const getReservations = async (req, res) => {
  const patronId = normalizePatronId(req.query.patronId);
  if (patronId.length < 3 || patronId.length > 40) {
    return res.status(400).json({ message: "Enter a valid student or patron ID." });
  }

  try {
    await releaseExpiredBookHolds({ patronId });
    const items = await Reservation.find({ patronId, resourceType: "book" })
      .populate("bookId", "title author isbn category library shelf callNumber coverImage")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load reservations." });
  }
};

const createReservation = async (req, res) => {
  const patronId = normalizePatronId(req.body.patronId);
  const { bookId } = req.body;
  const pickupDate = parsePickupDate(req.body.pickupDate);
  const pickupTime = parsePickupTime(req.body.pickupTime);
  const pickupLocation = String(req.body.pickupLocation || "").trim();

  if (patronId.length < 3 || patronId.length > 40) {
    return res.status(400).json({ message: "Enter a valid student or patron ID." });
  }
  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Select a valid catalog book." });
  }
  if (!pickupDate) {
    return res.status(400).json({ message: "Choose a pickup date within the next seven days." });
  }
  if (!pickupTime) {
    return res.status(400).json({ message: "Choose a pickup time in HH:MM format." });
  }
  if (pickupLocation.length < 3 || pickupLocation.length > 120) {
    return res.status(400).json({ message: "Choose or enter a valid pickup library or desk." });
  }
  if (req.body.termsAccepted !== true) {
    return res.status(400).json({ message: "Accept the reservation terms to continue." });
  }

  try {
    await releaseExpiredBookHolds({ bookId });
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found in the catalog." });

    const duplicate = await Reservation.exists({
      resourceType: "book",
      bookId,
      patronId,
      status: "confirmed",
    });
    if (duplicate) {
      return res.status(409).json({ message: "You already have an active reservation for this book." });
    }

    const availableBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: "after" }
    );
    if (!availableBook) {
      return res.status(409).json({ message: "This book is currently unavailable." });
    }

    try {
      const reservation = await Reservation.create({
        reservationId: `RB-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
        resourceType: "book",
        patronId,
        bookId: availableBook._id,
        pickupDate,
        pickupTime,
        pickupLocation,
        holdExpiresAt: new Date(pickupDate.getTime() + 48 * 60 * 60 * 1000),
        activeBookKey: `${availableBook._id}:${patronId}`,
      });
      const populated = await Reservation.findById(reservation._id)
        .populate("bookId", "title author isbn category library shelf callNumber coverImage")
        .lean();
      return res.status(201).json(populated);
    } catch (error) {
      await Book.updateOne({ _id: availableBook._id }, { $inc: { availableCopies: 1 } });
      if (error.code === 11000 && error.keyPattern?.activeBookKey) {
        return res.status(409).json({ message: "You already have an active reservation for this book." });
      }
      if (error.code === 11000 && error.keyPattern?.reservationId) {
        return res.status(409).json({ message: "A reservation ID conflict occurred. Please try again." });
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Unable to create this reservation." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Unable to create this reservation." });
  }
};

const updateReservation = async (req, res) => {
  const patronId = normalizePatronId(req.body.patronId);
  const pickupDate = parsePickupDate(req.body.pickupDate);
  const pickupTime = parsePickupTime(req.body.pickupTime);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation ID." });
  }
  if (patronId.length < 3 || patronId.length > 40 || !pickupDate) {
    return res.status(400).json({ message: "Enter your ID and choose a pickup date within seven days." });
  }
  if (pickupTime === null) {
    return res.status(400).json({ message: "Choose a pickup time in HH:MM format." });
  }

  try {
    await releaseExpiredBookHolds({ patronId });
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, patronId, resourceType: "book", status: "confirmed" },
      {
        $set: {
          pickupDate,
          pickupTime,
          holdExpiresAt: new Date(pickupDate.getTime() + 48 * 60 * 60 * 1000),
        },
      },
      { returnDocument: "after", runValidators: true }
    )
      .populate("bookId", "title author isbn category library shelf callNumber coverImage")
      .lean();

    if (!reservation) {
      return res.status(404).json({ message: "Active reservation not found for this ID." });
    }
    return res.json(reservation);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update this reservation." });
  }
};

const cancelReservation = async (req, res) => {
  const patronId = normalizePatronId(req.query.patronId || req.body.patronId);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation ID." });
  }
  if (patronId.length < 3 || patronId.length > 40) {
    return res.status(400).json({ message: "Enter a valid student or patron ID." });
  }

  try {
    await releaseExpiredBookHolds({ patronId });
    const reservation = await Reservation.findOneAndUpdate(
      {
        _id: req.params.id,
        patronId,
        resourceType: "book",
        status: "confirmed",
      },
      { $set: { status: "cancelled" }, $unset: { activeBookKey: 1 } },
      { returnDocument: "after" }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Active reservation not found for this ID." });
    }

    await Book.updateOne({ _id: reservation.bookId }, { $inc: { availableCopies: 1 } });
    return res.json({ message: "Reservation cancelled.", reservationId: reservation._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel this reservation." });
  }
};

module.exports = {
  getReservations,
  createReservation,
  updateReservation,
  cancelReservation,
};