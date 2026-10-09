const express = require("express");

const {
  createReservation,
  getReservations,
  cancelReservation,
} = require("../controllers/seatReservationController");

const router = express.Router();

// POST /api/seat-reservations
router.post("/", createReservation);

// GET /api/seat-reservations
router.get("/", getReservations);

// DELETE /api/seat-reservations/:id
router.delete("/:id", cancelReservation);
router.patch("/:id/cancel", cancelReservation);

module.exports = router;