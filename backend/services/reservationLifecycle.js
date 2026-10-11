const mongoose = require("mongoose");
const Book = require("../models/Book");
const Seat = require("../models/Seat");
const Reservation = require("../models/Reservation");

/**
 * Single resource-release helper for Staff actions (WF-20 reject, WF-23
 * no-show, and terminal status changes via WF-19).
 *
 * Why it exists:
 * - Student book holds decrement Book.availableCopies at create time and set
 *   a unique `activeBookKey` (see reservationController.createReservation).
 *   So a reservation document holds a copy IFF activeBookKey is present.
 * - The old staff code incremented copies for EVERY reject/no-show call
 *   (double release) and looked at `reservation.book` (staff-only field) so
 *   student reservations were never released at all.
 *
 * Exactly-once guarantee:
 *   The status transition (active -> terminal) is a single atomic
 *   findOneAndUpdate guarded on status $in HOLDING_STATUSES. Only the caller
 *   that wins that transition may release; repeats get applied:false and the
 *   endpoint answers 409 without touching inventory. Because activeBookKey is
 *   only unset by the winner, `reservation.activeBookKey` read BEFORE the
 *   transition tells us whether this doc ever took a copy.
 */

// Statuses that still represent an active hold on a resource.
const HOLDING_STATUSES = ["confirmed", "CONFIRMED", "READY_FOR_PICKUP", "EXCEPTION"];

// Statuses that end a reservation and free its resources.
const TERMINAL_STATUSES = ["cancelled", "CANCELLED", "REJECTED", "NO_SHOW", "expired"];

/**
 * Finds a reservation by its human reservationId OR Mongo ObjectId,
 * including the (select:false) hold key so callers can tell whether the
 * reservation actually took a book copy.
 */
const findReservationWithHold = async (id) => {
  if (typeof id !== "string" || id.trim() === "") return null;

  const trimmed = id.trim();
  const conditions = [{ reservationId: trimmed }];
  if (mongoose.isValidObjectId(trimmed)) {
    conditions.push({ _id: trimmed });
  }

  return Reservation.findOne({ $or: conditions }).select("+activeBookKey");
};

/**
 * Atomically moves a reservation to a terminal status and releases the
 * resources it held — at most once, ever.
 *
 * @param {import("mongoose").Document} reservation doc from findReservationWithHold
 * @param {object} options
 * @param {string} options.status terminal status to store (REJECTED / NO_SHOW / CANCELLED ...)
 * @param {object} [options.set] extra fields to persist in the same transition
 * @returns {Promise<{applied: boolean, reservation: object|null}>} applied=false
 *          when the reservation was already terminal (nothing was released).
 */
const applyTerminalStatus = async (reservation, { status, set = {} }) => {
  if (!reservation || !reservation._id) {
    return { applied: false, reservation: null };
  }

  const updated = await Reservation.findOneAndUpdate(
    { _id: reservation._id, status: { $in: HOLDING_STATUSES } },
    { $set: { ...set, status }, $unset: { activeBookKey: "" } },
    { returnDocument: "after" }
  ).select("+activeBookKey");

  if (!updated) {
    return { applied: false, reservation: null };
  }

  // Release the book copy only if this reservation ever held one. The hold
  // key format is "<bookObjectId>:<patronId>" (see createReservation), so it
  // also recovers the book reference for legacy docs missing bookId/book.
  const holdKey = typeof reservation.activeBookKey === "string" ? reservation.activeBookKey : "";
  const keyBookPart = holdKey.split(":")[0];
  const bookRef =
    updated.bookId ||
    updated.book ||
    (mongoose.isValidObjectId(keyBookPart) ? keyBookPart : null);

  if (bookRef) {
    try {
      await Book.updateOne({ _id: bookRef }, { $inc: { availableCopies: 1 } });
    } catch (error) {
      console.error("Staff release: book copy increment failed:", error.message);
    }
  }

  // Free any physical Seat document tracked by the staff seat map. Idempotent
  // field set; no counter involved, so repeats could not over-release anyway.
  try {
    if (updated.seat) {
      await Seat.findOneAndUpdate(
        { _id: updated.seat },
        { $set: { status: "available", occupiedBy: {} } }
      );
    } else if (updated.seatNumber && updated.room) {
      await Seat.findOneAndUpdate(
        { seatNumber: updated.seatNumber, room: updated.room },
        { $set: { status: "available", occupiedBy: {} } }
      );
    }
  } catch (error) {
    console.error("Staff release: seat update failed:", error.message);
  }

  return { applied: true, reservation: updated };
};

module.exports = {
  HOLDING_STATUSES,
  TERMINAL_STATUSES,
  findReservationWithHold,
  applyTerminalStatus,
};
