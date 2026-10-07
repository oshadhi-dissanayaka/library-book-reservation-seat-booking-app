// ============================================================
// Reservation routes (WF-11 Seat Reservation)
// Mounted at /api/reservations in server.js
// ============================================================

const express = require("express");
const {
  createReservation,
  getReservations,
} = require("../controllers/reservationController");

const router = express.Router();

// POST /api/reservations  -> create a reservation
router.post("/", createReservation);

// GET  /api/reservations  -> list demo-student reservations
//   (supports ?readingRoom, ?date, ?time filters used by WF-10)
router.get("/", getReservations);

module.exports = router;
