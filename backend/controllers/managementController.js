// In-memory reports store with initial data so management can view, generate, update, and delete reports (CRUD)
let managementReports = [
  {
    id: "rep-1",
    title: "Book Usage Report",
    type: "book-usage",
    period: "September 2026",
    updatedDate: "20 Sep 2026",
    fileSize: "2.4 MB",
    status: "Ready to review",
    description: "Monthly circulation, category breakdown, and shelf checkout frequencies.",
    audited: true,
  },
  {
    id: "rep-2",
    title: "Reservation Report",
    type: "reservation",
    period: "September 2026",
    updatedDate: "20 Sep 2026",
    fileSize: "1.8 MB",
    status: "Select audit",
    description: "Hold queues, confirmation ratios, student pickups, and cancellations.",
    audited: true,
  },
  {
    id: "rep-3",
    title: "Seat Occupancy Report",
    type: "seat-occupancy",
    period: "September 2026",
    updatedDate: "20 Sep 2026",
    fileSize: "1.6 MB",
    status: "Select audit",
    description: "Reading Room A & B hourly density, peak utilization, and desk turn rates.",
    audited: true,
  },
];

// 1. Dashboard Overview
const getDashboard = async (req, res) => {
  try {
    const dashboardData = {
      period: "September 2026",
      telemetryStatus: "Live telemetry sync active",
      lastUpdated: "Updated 10m ago",
      totalBooks: 1248,
      bookGrowth: "+12% vs last mo",
      branches: 3,
      totalReservations: 326,
      holdsProcessed: true,
      confirmedReservations: 284,
      cancelledReservations: 42,
      seatOccupancy: 78,
      seatOccupancyStatus: "Peak Hours",
      totalDesks: 400,
      occupiedDesks: 312,
      circulationAnalytics: {
        trajectory: "Q3 Trajectory",
        monthlyData: [
          { month: "Jul", value: 940, heightPct: 58 },
          { month: "Aug", value: 1114, heightPct: 75 },
          { month: "Sep", value: 1248, heightPct: 100 },
        ],
        highlight: "Peak circulation recorded in Week 3 (Midterm cycle)",
      },
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load management dashboard",
      error: error.message,
    });
  }
};

// 2. Book Usage Report & Analytics
const getBookUsageReport = async (req, res) => {
  try {
    const bookUsageData = {
      period: "September 2026",
      totalBooks: 1248,
      circulatedVolumes: 1248,
      growthVsAug: "+12.4% vs Aug",
      regularLoans: 1012,
      courseReserves: 236,
      topCategories: [
        { code: "CS-301", name: "Database", count: 284, unit: "vol", pct: 100 },
        { code: "CS-102", name: "Programming", count: 231, unit: "vol", pct: 81 },
        { code: "CS-204", name: "Operating Systems", count: 195, unit: "vol", pct: 68 },
        { code: "CS-201", name: "Algorithms", count: 164, unit: "vol", pct: 58 },
      ],
      usageTrend: {
        type: "Weekly count",
        weeks: [
          { week: "Wk 1", count: 260, heightPct: 65 },
          { week: "Wk 2", count: 310, heightPct: 80 },
          { week: "Wk 3", count: 358, heightPct: 100 },
          { week: "Wk 4", count: 300, heightPct: 76 },
        ],
        note: "Peak loan circulation coincided with Midterm Prep (Week 3).",
      },
    };

    res.status(200).json(bookUsageData);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load book usage report",
      error: error.message,
    });
  }
};

// 3. Seat Occupancy Report & Analytics
const getSeatOccupancyReport = async (req, res) => {
  try {
    const occupancyData = {
      period: "September 2026",
      campusHub: "Campus Central Hub",
      hallName: "Main Reading Rooms (A & B)",
      totalCatalogedDesks: 50,
      overallOccupancy: 78,
      statusLabel: "Steady Usage",
      averageOccupancyRate: 78,
      capacityBenchmark: 50,
      averageInUse: 39,
      rooms: [
        {
          id: "room-a",
          name: "Reading Room A",
          type: "Quiet Zone",
          wing: "West Wing • Floor 2",
          occupancy: 84,
          utilized: 25,
          total: 30,
          remaining: 5,
        },
        {
          id: "room-b",
          name: "Reading Room B",
          type: "Collaborative Study",
          wing: "East Wing • Floor 1",
          occupancy: 71,
          utilized: 14,
          total: 20,
          remaining: 6,
        },
      ],
      hourlyDistribution: [
        { hour: "08", pct: 35, peak: false },
        { hour: "09", pct: 50, peak: false },
        { hour: "10", pct: 70, peak: false },
        { hour: "11", pct: 88, peak: true },
        { hour: "12", pct: 92, peak: true },
        { hour: "13", pct: 91, peak: true },
        { hour: "14", pct: 89, peak: true },
        { hour: "15", pct: 85, peak: true },
        { hour: "16", pct: 75, peak: false },
        { hour: "17", pct: 60, peak: false },
        { hour: "18", pct: 45, peak: false },
        { hour: "19", pct: 35, peak: false },
        { hour: "20", pct: 20, peak: false },
      ],
      peakUtilization: {
        period: "11:00 AM – 03:00 PM",
        peakCap: "92%",
      },
    };

    res.status(200).json(occupancyData);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load seat occupancy report",
      error: error.message,
    });
  }
};

// 4. Reservation Analytics
const getReservationAnalytics = async (req, res) => {
  try {
    const reservationData = {
      period: "September 2026",
      totalBookings: 326,
      subTitle: "Total reservations requested",
      growthVsAug: "+14.2% from August",
      capacityStatus: "100% capacity cap active",
      statusBreakdown: {
        fulfillmentRate: "87.1% Fulfillment Rate",
        confirmed: 284,
        confirmedPct: 87,
        cancelled: 42,
        cancelledPct: 13,
      },
      weeklyDistribution: [
        { week: "W1", confirmed: 72, cancelled: 10, confHeight: 70, cancHeight: 15 },
        { week: "W2", confirmed: 82, cancelled: 12, confHeight: 82, cancHeight: 18 },
        { week: "W3", confirmed: 96, cancelled: 14, confHeight: 96, cancHeight: 20 },
        { week: "W4", confirmed: 74, cancelled: 8, confHeight: 74, cancHeight: 12 },
      ],
      weeklyHighlights: {
        peak: "Peak: Week 3 (96 total)",
        dailyAvg: "24.2 / day avg",
      },
      leadTime: {
        value: "4.2 hrs",
        label: "Average reservation advance",
      },
      peakDays: {
        value: "Mon – Wed",
        label: "62% of weekly check-ins",
      },
    };

    res.status(200).json(reservationData);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load reservation analytics",
      error: error.message,
    });
  }
};

// 5. CRUD: Management Reports List (Read)
const getManagementReports = async (req, res) => {
  try {
    res.status(200).json({
      period: "September 2026",
      session: "Fall Semester • Cycle M-09",
      reports: managementReports,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load management reports",
      error: error.message,
    });
  }
};

// CRUD: Create new audit / generated report (Create)
const createManagementReport = async (req, res) => {
  try {
    const { title, type, period, description } = req.body;
    const newReport = {
      id: `rep-${Date.now()}`,
      title: title || "Custom Library Report",
      type: type || "general",
      period: period || "September 2026",
      updatedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      fileSize: "1.5 MB",
      status: "Ready to review",
      description: description || "Generated executive summary and audit log.",
      audited: true,
    };

    managementReports.unshift(newReport);
    res.status(201).json({ message: "Report generated successfully", report: newReport });
  } catch (error) {
    res.status(500).json({ message: "Failed to create report", error: error.message });
  }
};

// CRUD: Update report status (Update)
const updateManagementReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, description } = req.body;

    const report = managementReports.find((r) => r.id === id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) report.status = status;
    if (description) report.description = description;

    res.status(200).json({ message: "Report updated successfully", report });
  } catch (error) {
    res.status(500).json({ message: "Failed to update report", error: error.message });
  }
};

// CRUD: Delete report (Delete)
const deleteManagementReport = async (req, res) => {
  try {
    const { id } = req.params;
    managementReports = managementReports.filter((r) => r.id !== id);
    res.status(200).json({ message: "Report deleted successfully", id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete report", error: error.message });
  }
};

module.exports = {
  getDashboard,
  getBookUsageReport,
  getReservationAnalytics,
  getSeatOccupancyReport,
  getManagementReports,
  createManagementReport,
  updateManagementReport,
  deleteManagementReport,
};