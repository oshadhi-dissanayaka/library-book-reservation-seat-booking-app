const express = require("express");

const {
  getDashboard,
  getBookUsageReport,
  getReservationAnalytics,
  getSeatOccupancyReport,
  getManagementReports,
} = require("../controllers/managementController");

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/book-usage", getBookUsageReport);
router.get("/reservation-analytics", getReservationAnalytics);
router.get("/seat-occupancy", getSeatOccupancyReport);
router.get("/reports", getManagementReports);

module.exports = router;