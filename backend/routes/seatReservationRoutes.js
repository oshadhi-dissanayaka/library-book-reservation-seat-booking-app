const express = require("express");

const {
  createReservation,
  getReservations,
} = require("../controllers/seatReservationController");

const router = express.Router();

// POST /api/seat-reservations
router.post("/", createReservation);

// GET /api/seat-reservations
router.get("/", getReservations);

module.exports = router;