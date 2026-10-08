const express = require("express");

const {
  getDashboard,
  getBookUsageReport,
  getReservationAnalytics,
  getSeatOccupancyReport,
  getManagementReports,
  createManagementReport,
  updateManagementReport,
  deleteManagementReport,
} = require("../controllers/managementController");

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/book-usage", getBookUsageReport);
router.get("/reservation-analytics", getReservationAnalytics);
router.get("/seat-occupancy", getSeatOccupancyReport);

// CRUD routes for Management Reports
router.get("/reports", getManagementReports);
router.post("/reports", createManagementReport);
router.put("/reports/:id", updateManagementReport);
router.delete("/reports/:id", deleteManagementReport);

module.exports = router;