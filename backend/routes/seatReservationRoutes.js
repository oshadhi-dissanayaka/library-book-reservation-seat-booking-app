const express = require("express");

const {
  createReservation,
  createReservationBatch,
  getReservations,
  getReservationById,
  cancelReservation,
  updateReservation,
} = require("../controllers/seatReservationController");

const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");

// POST /api/seat-reservations
router.post("/", createReservation);

// POST /api/seat-reservations/batch — multi-block booking (validate-all,
// then create-all with rollback on a late failure so no partial booking
// is ever left behind).
router.post("/batch", createReservationBatch);

// GET /api/seat-reservations
//   ?studentId=...&status=...        -> the student's own list (WF-13/15)
//   ?readingRoom=...&date=...&time=  -> seat occupancy for the map (WF-10)
router.get("/", getReservations);

// GET /api/seat-reservations/:id — single persisted reservation (WF-12/14)
router.get("/:id", getReservationById);

router.patch("/:id", requireAuth, requireRole("student", "academic_staff"), updateReservation);

// PATCH /api/seat-reservations/:id/cancel — cancel an active reservation (WF-14)
router.patch("/:id/cancel", cancelReservation);

// DELETE /api/seat-reservations/:id (kept for origin/dev compatibility)
router.delete("/:id", cancelReservation);

module.exports = router;
