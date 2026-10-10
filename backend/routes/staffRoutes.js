const express = require("express");

const {
  loginStaff,
  getStaffDashboard,
  getStaffReservations,
  getReservationById,
  updateReservationStatus,
  rejectReservation,
  getBooks,
  updateBookAvailability,
  createBook,
  getOccupancy,
  updateSeatStatus,
  createReadingRoom,
  addSeatsToRoom,
  getNoShowsAndCancellations,
  markReservationNoShow,
} = require("../controllers/staffController");

const router = express.Router();

// WF-16: Staff Login
router.post("/login", loginStaff);

// WF-17: Staff Dashboard
router.get("/dashboard", getStaffDashboard);

// WF-18: Reservation Management
router.get("/reservations", getStaffReservations);

// WF-19: Reservation Details & Status Update
router.get("/reservations/:id", getReservationById);
router.patch("/reservations/:id/status", updateReservationStatus);

// WF-20: Reject / Cancel Reservation
router.patch("/reservations/:id/reject", rejectReservation);

// WF-21: Book Availability Management
router.get("/books", getBooks);
router.post("/books", createBook);
router.patch("/books/:id/availability", updateBookAvailability);

// WF-22: Reading Room Occupancy & Management
router.get("/occupancy", getOccupancy);
router.post("/reading-rooms", createReadingRoom);
router.post("/reading-rooms/:id/seats", addSeatsToRoom);
router.patch("/occupancy/seat/:id", updateSeatStatus);

// WF-23: No-show & Cancellation Management
router.get("/no-shows", getNoShowsAndCancellations);
router.patch("/reservations/:id/no-show", markReservationNoShow);

module.exports = router;
