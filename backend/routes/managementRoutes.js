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
  listLibraryStaff,
  createLibraryStaff,
  setLibraryStaffStatus,
} = require("../controllers/managementController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Existing management dashboards / reports.
router.get("/dashboard", getDashboard);
router.get("/book-usage", getBookUsageReport);
router.get("/reservation-analytics", getReservationAnalytics);
router.get("/seat-occupancy", getSeatOccupancyReport);
router.get("/reports", getManagementReports);
router.post("/reports", createManagementReport);
router.put("/reports/:id", updateManagementReport);
router.delete("/reports/:id", deleteManagementReport);

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
