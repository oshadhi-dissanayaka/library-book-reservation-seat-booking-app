const express = require("express");
const {
  cancelReservation,
  createReservation,
  getReservations,
  updateReservation,
} = require("../controllers/reservationController");

const router = express.Router();

router.get("/", getReservations);
router.post("/", createReservation);
router.patch("/:id", updateReservation);
router.delete("/:id", cancelReservation);

module.exports = router;