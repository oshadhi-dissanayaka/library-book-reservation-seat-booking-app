const express = require("express");

const {
  getDashboard,
  getBookUsageReport,
  getReservationAnalytics,
  getSeatOccupancyReport,
  getManagementReports,
  listLibraryStaff,
  createLibraryStaff,
  setLibraryStaffStatus,
} = require("../controllers/managementController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Existing management dashboards / reports (unchanged behaviour).
router.get("/dashboard", getDashboard);
router.get("/book-usage", getBookUsageReport);
router.get("/reservation-analytics", getReservationAnalytics);
router.get("/seat-occupancy", getSeatOccupancyReport);
router.get("/reports", getManagementReports);

// Library Staff accounts - management role only.
router.get(
  "/library-staff",
  requireAuth,
  requireRole("management"),
  listLibraryStaff
);
router.post(
  "/library-staff",
  requireAuth,
  requireRole("management"),
  createLibraryStaff
);
router.patch(
  "/library-staff/:institutionalId/status",
  requireAuth,
  requireRole("management"),
  setLibraryStaffStatus
);

module.exports = router;
