const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Book = require("../models/Book");
const ReadingRoom = require("../models/ReadingRoom");
const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");
const SeatReservation = require("../models/SeatReservation");
const StaffLog = require("../models/StaffLog");
const UserAccount = require("../models/UserAccount");
const { signToken } = require("../middleware/auth");
const {
  findReservationWithHold,
  applyTerminalStatus,
} = require("../services/reservationLifecycle");

// ---------------------------------------------------------------------------
// Staff login (WF-16) authenticates against the real UserAccount collection
// (role: library_staff, bcrypt hash). Library Staff accounts are issued by
// University Management - there is no public staff self-signup.
//
// `configuredStaffUsername` is ONLY the fallback id used in audit-log rows
// when a caller does not pass an explicit staffId.
// ---------------------------------------------------------------------------
const configuredStaffUsername = (process.env.STAFF_USERNAME || "LIB001")
  .trim()
  .toUpperCase();

// Helper to log staff actions
const logAction = async (staffId, action, targetType, targetId, details, status = "SUCCESS") => {
  try {
    await StaffLog.create({
      staffId: staffId || configuredStaffUsername,
      action,
      targetType,
      targetId: String(targetId || ""),
      details: String(details || ""),
      status,
    });
  } catch (err) {
    console.warn("Audit logging warning:", err.message);
  }
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// Escapes user input so it can be safely used inside a RegExp (a bare "(" in
// a search term used to crash the whole reservations endpoint).
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Pickup dates are stored as UTC midnight (see parsePickupDate in
// reservationController), so "today" is matched on the stored UTC day.
const utcDayRange = () => {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

// The Today queue = pickups scheduled today + everything still awaiting
// circulation action (confirmed / ready for pickup).
const todayQueueCondition = () => {
  const { start, end } = utcDayRange();
  return {
    $or: [
      { pickupDate: { $gte: start, $lt: end } },
      { status: { $in: ["confirmed", "CONFIRMED", "READY_FOR_PICKUP"] } },
    ],
  };
};

const EXCEPTIONS_CONDITION = {
  $or: [{ requiresAttention: true }, { status: "EXCEPTION" }],
};

// Seat reservations store the calendar date as a local "YYYY-MM-DD" string
// (same format Member 2 writes), so staff "today" uses the server-local day.
const localIsoDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "2026-10-09T00:00:00.000Z" -> "09 October 2026" (UTC date part, matching how
// the student's pickup date was parsed). Empty string when unknown — never a
// fabricated placeholder date.
const formatDisplayDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getUTCDate()).padStart(2, "0")} ${
    MONTH_NAMES[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
};

// Staff-facing statuses the UI may send (see staff.types.ts).
const STAFF_STATUSES = [
  "CONFIRMED",
  "READY_FOR_PICKUP",
  "EXCEPTION",
  "CANCELLED",
  "NO_SHOW",
  "COMPLETED",
  "REJECTED",
];

// Staff statuses that end a reservation and free its resources.
const STAFF_TERMINAL_STATUSES = ["CANCELLED", "NO_SHOW", "REJECTED"];

// Staff -> stored status mapping. Staff-side "CONFIRMED" is stored as the
// canonical lowercase "confirmed" so the student-side hold logic (cancel,
// expiry and duplicate checks all query status: "confirmed") keeps working.
const STORED_STATUS_FROM_STAFF = { CONFIRMED: "confirmed" };

// Stored -> staff display status (student flow stores lowercase values).
const STAFF_STATUS_DISPLAY = {
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  completed: "COMPLETED",
  expired: "EXPIRED",
};

const staffDisplayStatus = (stored) => {
  const value = String(stored || "");
  return STAFF_STATUS_DISPLAY[value] || value.toUpperCase();
};

/**
 * Staff DTO / projection. The Reservation collection stores both members'
 * fields; the staff UI reads the staff-side names. Every value below derives
 * from the stored document — nothing is fabricated. When no student name was
 * ever stored (student flow only has a patron/student ID), the ID itself is
 * returned so the UI shows the identifier instead of blank text.
 */
const toStaffReservation = (doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  // bookId may be populated (object) or a raw ObjectId.
  const bookPopulated =
    raw.bookId && typeof raw.bookId === "object" && raw.bookId._id
      ? raw.bookId
      : null;
  const bookRef = bookPopulated
    ? String(bookPopulated._id)
    : raw.bookId
      ? String(raw.bookId)
      : raw.book
        ? String(raw.book)
        : "";

  const studentId = raw.studentId || raw.patronId || "";

  return {
    _id: String(raw._id),
    reservationId: raw.reservationId || String(raw._id),
    type: raw.type || (raw.resourceType === "book" ? "Book" : "Seat"),
    studentId,
    studentName: raw.studentName || studentId,
    studentProgram: raw.studentProgram || "",
    book: bookRef,
    bookTitle: raw.bookTitle || (bookPopulated ? bookPopulated.title : "") || "",
    bookSubtitle: raw.bookSubtitle || "",
    bookAuthor: raw.bookAuthor || (bookPopulated ? bookPopulated.author : "") || "",
    bookEdition: raw.bookEdition || (bookPopulated ? bookPopulated.edition : "") || "",
    bookShelf:
      raw.bookShelf ||
      (bookPopulated ? bookPopulated.shelf || bookPopulated.shelfLocation : "") ||
      "",
    pickupDate: formatDisplayDate(raw.pickupDate || raw.seatStartAt),
    pickupTime: raw.pickupTime || "",
    pickupLocation: raw.pickupLocation || "",
    loanDuration: raw.loanDuration || "",
    seatNumber: raw.seatNumber !== undefined && raw.seatNumber !== null ? String(raw.seatNumber) : "",
    room: raw.room || "",
    timeSlot: raw.timeSlot || raw.pickupTime || "",
    status: staffDisplayStatus(raw.status),
    requiresAttention: Boolean(raw.requiresAttention),
    attentionType: raw.attentionType || "NONE",
    attentionReason: raw.attentionReason || "",
    deskNote: raw.deskNote || "",
    rejectionReason: raw.rejectionReason || "",
    rejectionExplanation: raw.rejectionExplanation || "",
    rejectionStaffId: raw.rejectionStaffId || "",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const BOOK_POPULATE = {
  path: "bookId",
  select: "title author edition shelf shelfLocation category isbn",
};

// Detail and action responses are re-loaded with the same book population as
// list reads, so book title/author/shelf never come back blank after an action.
const loadStaffReservation = async (id) => {
  const doc = await Reservation.findById(id).populate(BOOK_POPULATE);
  return toStaffReservation(doc);
};

// Shared between the occupancy builder and seat updates: physical seat
// numbers are stored in mixed formats; only pure-numeric rows participate in
// the student-numbered seat map.

/**
 * WF-22 occupancy, shared by the dashboard and the occupancy screen.
 * Truthful sources only:
 *   - ReadingRoom        -> room list + capacity (the single source of rooms)
 *   - SeatReservation    -> student seat bookings for today ("reserved")
 *   - Seat (staff floor) -> physical overrides staff set ("occupied"/"maintenance")
 * No generated/demo numbers anywhere; an empty database yields zeros.
 */
const buildOccupancySnapshot = async () => {
  const rooms = await ReadingRoom.find({}).sort({ name: 1 });
  const today = localIsoDate();

  const activeSeatReservations = await SeatReservation.find({
    date: today,
    status: "active",
  });
  const physicalSeats = await Seat.find({});

  const roomsOut = rooms.map((room) => {
    const total = Number(room.totalSeats) || 0;

    const physicalByNumber = new Map();
    // The shared seats collection holds two labeling schemes for Room A/B:
    // legacy staff floor-plan rows ("A01".."D05") and pure numeric rows that
    // match student seat numbers ("1".."24"). Only pure-numeric rows are
    // merged into this student-numbered map — the lettered demo rows have no
    // reliable mapping onto student seats, so they are neither displayed nor
    // counted (staff toggles on this map create/update numeric rows).
    physicalSeats
      .filter(
        (seat) =>
          seat.room === room.name && /^\d+$/.test(String(seat.seatNumber).trim())
      )
      .forEach((seat) => {
        physicalByNumber.set(Number(seat.seatNumber), seat);
      });

    const reservedByNumber = new Map();
    activeSeatReservations
      .filter((res) => String(res.readingRoom) === String(room._id))
      .forEach((res) => {
        const list = reservedByNumber.get(res.seatNumber) || [];
        list.push(res);
        reservedByNumber.set(res.seatNumber, list);
      });

    let reservedCount = 0;
    let occupiedCount = 0;
    let maintenanceCount = 0;
    const seats = [];

    for (let n = 1; n <= total; n += 1) {
      const physical = physicalByNumber.get(n) || null;
      const reservationsForSeat = reservedByNumber.get(n) || [];
      const reserved = reservationsForSeat.length > 0;

      let status = "available";
      if (physical && physical.status === "maintenance") {
        status = "maintenance";
      } else if (physical && physical.status === "occupied") {
        status = "occupied";
      } else if (reserved) {
        status = "reserved";
      }

      if (status === "occupied") occupiedCount += 1;
      else if (status === "reserved") reservedCount += 1;
      else if (status === "maintenance") maintenanceCount += 1;

      seats.push({
        _id: physical
          ? String(physical._id)
          : `derived:${String(room._id)}:${n}`,
        seatNumber: String(n),
        room: room.name,
        floor: room.floor || "",
        wing: room.zone || "",
        status,
        occupiedBy: {
          studentId:
            status === "reserved"
              ? String(reservationsForSeat[0]?.studentId || "")
              : status === "occupied"
                ? String(physical?.occupiedBy?.studentId || "")
                : "",
          studentName:
            status === "occupied" ? String(physical?.occupiedBy?.studentName || "") : "",
          reservationId:
            status === "reserved"
              ? String(reservationsForSeat[0]?._id || "")
              : status === "occupied"
                ? String(physical?.occupiedBy?.reservationId || "")
                : "",
          startTime:
            status === "reserved"
              ? String(reservationsForSeat[0]?.time || "")
              : status === "occupied"
                ? String(physical?.occupiedBy?.startTime || "")
                : "",
          endTime: status === "occupied" ? String(physical?.occupiedBy?.endTime || "") : "",
        },
      });
    }

    const taken = reservedCount + occupiedCount;
    return {
      name: room.name,
      floor: room.floor || "",
      wing: room.zone || "",
      totalSeats: total,
      // "occupied" here means physically occupied only; seats that merely have
      // a student booking today are reported separately as reserved, so the
      // UI label "N seats occupied" never claims a reserved seat is in use.
      occupiedSeats: occupiedCount,
      reservedSeats: reservedCount,
      // Truly free seats = everything that is neither held nor blocked.
      availableSeats: Math.max(total - taken - maintenanceCount, 0),
      occupancyRate: total > 0 ? Math.round((occupiedCount / total) * 100) : 0,
      seats,
    };
  });

  return { timestamp: new Date(), rooms: roomsOut };
};

// ---------------------------------------------------------------------------
// WF-16: Staff Login
// POST /api/staff/login
// ---------------------------------------------------------------------------
const loginStaff = async (req, res) => {
  try {
    const username = String(req.body.username || req.body.institutionalId || "")
      .trim()
      .toUpperCase();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Staff ID and password are required.",
      });
    }

    const account = await UserAccount.findOne({
      institutionalId: username,
      role: "library_staff",
    }).select("+passwordHash");

    // Same failure message whether the ID is unknown or the password is wrong.
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid Staff ID or password.",
      });
    }

    const validPassword = await bcrypt.compare(password, account.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid Staff ID or password.",
      });
    }

    if (!account.active) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive. Contact University Management.",
      });
    }

    const staffUser = {
      staffId: account.institutionalId,
      name: account.name,
      email: account.email,
      role: "Library Staff",
      desk: "Circulation Desk 01",
      shift: "08:00 - 17:00",
      mustChangePassword: account.mustChangePassword,
      token: signToken(account),
    };

    await logAction(
      staffUser.staffId,
      "STAFF_LOGIN",
      "SYSTEM",
      staffUser.staffId,
      "Staff successfully logged into Library Portal"
    );

    return res.status(200).json({
      success: true,
      message: "Staff authentication successful",
      data: staffUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error && error.message && error.message.indexOf("JWT_SECRET") !== -1
          ? error.message
          : "Staff login failed",
    });
  }
};

// ---------------------------------------------------------------------------
// WF-17: Staff Dashboard
// GET /api/staff/dashboard
// ---------------------------------------------------------------------------
const getStaffDashboard = async (req, res) => {
  try {
    // Real counts — zero stays zero, no prototype baselines anywhere.
    const [totalReservations, todayReservations, attentionRequiredCount] =
      await Promise.all([
        Reservation.countDocuments(),
        Reservation.countDocuments(todayQueueCondition()),
        Reservation.countDocuments(EXCEPTIONS_CONDITION),
      ]);

    const attentionItems = await Reservation.find(EXCEPTIONS_CONDITION)
      .populate(BOOK_POPULATE)
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentReservations = await Reservation.find({})
      .populate(BOOK_POPULATE)
      .sort({ updatedAt: -1 })
      .limit(5);

    const occupancy = await buildOccupancySnapshot();
    const totalSeats = occupancy.rooms.reduce(
      (sum, room) => sum + room.totalSeats,
      0
    );
    const takenSeats = occupancy.rooms.reduce(
      (sum, room) => sum + room.occupiedSeats,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        staff: {
          staffId: configuredStaffUsername,
          desk: "Circulation Desk 01",
          shift: "08:00 - 17:00",
          handoverTime: "14:00",
        },
        metrics: {
          reservationsToday: todayReservations,
          actualReservationsCount: totalReservations,
          attentionRequired: attentionRequiredCount,
          occupiedSeats: takenSeats,
          totalSeats,
        },
        requiresAttention: attentionItems.map(toStaffReservation),
        recentReservations: recentReservations.map(toStaffReservation),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load staff dashboard",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-18: Staff Reservation Management
// GET /api/staff/reservations?filter=&search=&type=
// ---------------------------------------------------------------------------
const getStaffReservations = async (req, res) => {
  try {
    const { filter, search, type } = req.query;

    // Each filter contributes its own condition; they are combined with $and
    // so search no longer overwrites the Today/Exceptions filter.
    const conditions = [];

    if (filter === "exceptions") {
      conditions.push(EXCEPTIONS_CONDITION);
    } else if (filter === "today") {
      conditions.push(todayQueueCondition());
    }

    if (type && type !== "all") {
      // Student reservations store the canonical lowercase resourceType and
      // have no staff-side `type` field, so match either representation.
      conditions.push({
        $or: [{ type }, { resourceType: String(type).toLowerCase() }],
      });
    }

    if (typeof search === "string" && search.trim() !== "") {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      const termConditions = [
        { reservationId: regex },
        { studentName: regex },
        { studentId: regex },
        { patronId: regex },
        { bookTitle: regex },
        { seatNumber: regex },
        { room: regex },
      ];

      // Book titles for student-created reservations live on the Book
      // collection (Reservation.bookTitle is empty there), so resolve
      // matching books first and include their ids in the search.
      const matchingBooks = await Book.find({
        $or: [{ title: regex }, { author: regex }, { isbn: regex }],
      })
        .select("_id")
        .limit(200)
        .lean();
      if (matchingBooks.length > 0) {
        termConditions.push({
          bookId: { $in: matchingBooks.map((book) => book._id) },
        });
      }

      conditions.push({ $or: termConditions });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const [reservations, allCount, todayCount, exceptionsCount] =
      await Promise.all([
        Reservation.find(query)
          .populate(BOOK_POPULATE)
          .sort({ updatedAt: -1 }),
        Reservation.countDocuments(),
        Reservation.countDocuments(todayQueueCondition()),
        Reservation.countDocuments(EXCEPTIONS_CONDITION),
      ]);

    // Real badge counts (the old API returned hardcoded 32 / 14 / 3).
    return res.status(200).json({
      success: true,
      counts: {
        all: allCount,
        actualAll: allCount,
        today: todayCount,
        actualToday: todayCount,
        exceptions: exceptionsCount,
        actualExceptions: exceptionsCount,
      },
      data: reservations.map(toStaffReservation),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reservations",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-19: Staff Reservation Details
// GET /api/staff/reservations/:id
// ---------------------------------------------------------------------------
const getReservationById = async (req, res) => {
  try {
    const reservation = await findReservationWithHold(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${req.params.id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: await loadStaffReservation(reservation._id),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load reservation details",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-19: Update Reservation Status
// PATCH /api/staff/reservations/:id/status
// ---------------------------------------------------------------------------
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deskNote, staffId } = req.body;

    if (status && !STAFF_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${STAFF_STATUSES.join(", ")}`,
      });
    }

    const reservation = await findReservationWithHold(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    const storedStatus = status ? STORED_STATUS_FROM_STAFF[status] || status : null;

    // Terminal statuses go through the shared lifecycle helper: the
    // active -> terminal transition happens atomically and releases the
    // held book/seat exactly once. Repeats get 409, never a double release.
    if (status && STAFF_TERMINAL_STATUSES.includes(status)) {
      const set = {};
      if (deskNote !== undefined) set.deskNote = String(deskNote);
      if (status === "CANCELLED") set.cancellationSource = "STAFF_ACTION";
      set.requiresAttention = false;

      const { applied, reservation: updated } = await applyTerminalStatus(
        reservation,
        { status: storedStatus, set }
      );

      if (!applied) {
        return res.status(409).json({
          success: false,
          message: `Reservation ${reservation.reservationId} is already closed (${staffDisplayStatus(
            reservation.status
          )}). No resources were released again.`,
        });
      }

      await logAction(
        staffId || configuredStaffUsername,
        "UPDATE_RESERVATION_STATUS",
        "RESERVATION",
        updated.reservationId,
        `Status updated to ${updated.status}`
      );

      return res.status(200).json({
        success: true,
        message: `Reservation ${updated.reservationId} updated to ${staffDisplayStatus(updated.status)}`,
        data: await loadStaffReservation(updated._id),
      });
    }

    // Re-opening a closed reservation would desync inventory (its copy was
    // already released), so it requires a brand new student reservation.
    if (
      storedStatus &&
      ["confirmed", "READY_FOR_PICKUP", "EXCEPTION"].includes(storedStatus) &&
      !["confirmed", "CONFIRMED", "READY_FOR_PICKUP", "EXCEPTION"].includes(
        reservation.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message: `Reservation ${reservation.reservationId} is already closed (${staffDisplayStatus(
          reservation.status
        )}) and cannot be re-opened.`,
      });
    }

    if (status) reservation.status = storedStatus;
    if (deskNote !== undefined) reservation.deskNote = String(deskNote);
    if (status === "READY_FOR_PICKUP" || status === "COMPLETED") {
      reservation.requiresAttention = false;
      reservation.attentionType = "NONE";
    }

    await reservation.save();

    await logAction(
      staffId || configuredStaffUsername,
      "UPDATE_RESERVATION_STATUS",
      "RESERVATION",
      reservation.reservationId,
      `Status updated to ${reservation.status}`
    );

    return res.status(200).json({
      success: true,
      message: `Reservation ${reservation.reservationId} updated to ${staffDisplayStatus(
        reservation.status
      )}`,
      data: await loadStaffReservation(reservation._id),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update reservation status",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-20: Reject/Cancel Reservation
// PATCH /api/staff/reservations/:id/reject
// ---------------------------------------------------------------------------
const rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, explanation, staffId } = req.body;

    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const reservation = await findReservationWithHold(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    const { applied, reservation: updated } = await applyTerminalStatus(reservation, {
      status: "REJECTED",
      set: {
        rejectionReason: String(reason).trim(),
        rejectionExplanation: explanation ? String(explanation) : "",
        rejectionStaffId: staffId || configuredStaffUsername,
        rejectionDate: new Date(),
        cancellationSource: "STAFF_ACTION",
        requiresAttention: false,
      },
    });

    if (!applied) {
      return res.status(409).json({
        success: false,
        message: `Reservation ${reservation.reservationId} is already closed (${staffDisplayStatus(
          reservation.status
        )}). No resources were released again.`,
      });
    }

    await logAction(
      staffId || configuredStaffUsername,
      "REJECT_RESERVATION",
      "RESERVATION",
      updated.reservationId,
      `Rejected. Reason: ${reason}. Explanation: ${explanation || "None"}`
    );

    return res.status(200).json({
      success: true,
      message: `Reservation ${updated.reservationId} has been successfully rejected. Student notified.`,
      data: await loadStaffReservation(updated._id),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject reservation",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-21: Book Availability Management
// GET /api/staff/books
// ---------------------------------------------------------------------------
const getBooks = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (typeof search === "string" && search.trim() !== "") {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { shelfLocation: regex },
        { category: regex },
      ];
    }

    const books = await Book.find(query).sort({ title: 1 });

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-21: Update Book Availability
// PATCH /api/staff/books/:id/availability
// ---------------------------------------------------------------------------
const updateBookAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, availableCopies, shelfLocation, notes, staffId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid book id" });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const allowedStatuses = ["Available", "Unavailable", "Under Maintenance", "In Repair"];
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    let parsedCopies;
    if (availableCopies !== undefined) {
      parsedCopies = Number(availableCopies);
      if (!Number.isInteger(parsedCopies) || parsedCopies < 0) {
        return res.status(400).json({
          success: false,
          message: "Available copies must be a non-negative integer.",
        });
      }
      if (parsedCopies > book.totalCopies) {
        return res.status(400).json({
          success: false,
          message: `Available copies cannot exceed total copies (${book.totalCopies}).`,
        });
      }
    }

    if (status !== undefined) book.status = status;
    if (shelfLocation !== undefined) book.shelfLocation = String(shelfLocation).trim();
    if (notes !== undefined) book.notes = notes;

    // Keep student reservations honest about staff availability changes:
    // the student flow only checks availableCopies > 0, so any non-Available
    // status must zero the copies, and restoring Available recalculates what
    // is genuinely free (total minus copies still held by active reservations)
    // unless the staff member typed an explicit number.
    if (status !== undefined || parsedCopies !== undefined) {
      if (status !== undefined && status !== "Available") {
        book.availableCopies = 0;
      } else if (parsedCopies !== undefined) {
        book.availableCopies = parsedCopies;
      } else {
        const activeHolds = await Reservation.countDocuments({
          bookId: book._id,
          status: { $in: ["confirmed", "CONFIRMED", "READY_FOR_PICKUP"] },
        });
        book.availableCopies = Math.max(book.totalCopies - activeHolds, 0);
      }
    }

    await book.save();

    await logAction(
      staffId || configuredStaffUsername,
      "UPDATE_BOOK_AVAILABILITY",
      "BOOK",
      book.title,
      `Status set to ${book.status}, ${book.availableCopies}/${book.totalCopies} copies at ${book.shelfLocation}`
    );

    return res.status(200).json({
      success: true,
      message: `Book availability updated successfully for "${book.title}"`,
      data: book,
    });
  } catch (error) {
    if (error && error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update book availability",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-22: Reading Room Occupancy
// GET /api/staff/occupancy
// ---------------------------------------------------------------------------
const getOccupancy = async (req, res) => {
  try {
    const snapshot = await buildOccupancySnapshot();

    return res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load reading room occupancy",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-22: Update Seat Status
// PATCH /api/staff/occupancy/seat/:id
// Accepts a real Seat document id, or a derived seat marker
// ("derived:<readingRoomId>:<seatNumber>") for seats that exist only because a
// student SeatReservation created them — an upsert then records the physical
// override. Only physical states are staff-settable; a student's active
// reservation stays reserved regardless (Member 2 owns that data).
// ---------------------------------------------------------------------------
const updateSeatStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, staffId } = req.body;

    const allowed = ["available", "occupied", "maintenance"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Seat status must be one of: ${allowed.join(", ")}`,
      });
    }

    let seat = null;

    if (mongoose.isValidObjectId(id)) {
      seat = await Seat.findById(id);
      if (!seat) {
        return res.status(404).json({ success: false, message: "Seat not found" });
      }
      seat.status = status;
      if (status === "available") seat.occupiedBy = {};
      await seat.save();
    } else {
      const derivedMatch = /^derived:([0-9a-fA-F]{24}):(\d+)$/.exec(String(id));
      if (!derivedMatch) {
        return res.status(404).json({ success: false, message: "Seat not found" });
      }

      const room = await ReadingRoom.findById(derivedMatch[1]);
      if (!room) {
        return res.status(404).json({ success: false, message: "Reading room not found" });
      }

      const targetNumber = Number(derivedMatch[2]);
      // Match an existing physical row only when it uses the pure-numeric
      // student numbering ("5" / "05") for this seat — legacy lettered rows
      // ("A05") are a different scheme and are never touched or duplicated by
      // this map. Numeric rows are updated in place; otherwise one is created.
      const roomSeats = await Seat.find({ room: room.name });
      const existing = roomSeats.find((candidate) => {
        const label = String(candidate.seatNumber).trim();
        return /^\d+$/.test(label) && Number(label) === targetNumber;
      });

      if (existing) {
        seat = existing;
        seat.status = status;
        if (status === "available") seat.occupiedBy = {};
        await seat.save();
      } else {
        seat = await Seat.findOneAndUpdate(
          { room: room.name, seatNumber: String(targetNumber) },
          {
            $set: { status, ...(status === "available" ? { occupiedBy: {} } : {}) },
            $setOnInsert: {
              room: room.name,
              seatNumber: String(targetNumber),
              floor: room.floor || "",
              wing: room.zone || "",
            },
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
      }
    }

    await logAction(
      staffId || configuredStaffUsername,
      "UPDATE_SEAT_STATUS",
      "SEAT",
      seat.seatNumber,
      `Seat ${seat.seatNumber} set to ${seat.status}`
    );

    return res.status(200).json({
      success: true,
      message: `Seat ${seat.seatNumber} status updated to ${seat.status}`,
      data: seat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update seat status",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-23: No-show & Cancellation Management
// GET /api/staff/no-shows
// ---------------------------------------------------------------------------
const getNoShowsAndCancellations = async (req, res) => {
  try {
    // Includes the student-side lowercase terminal statuses so student
    // cancellations/expiry show up here too, not only staff uppercase ones.
    const records = await Reservation.find({
      status: { $in: ["NO_SHOW", "CANCELLED", "REJECTED", "cancelled", "expired"] },
    })
      .populate(BOOK_POPULATE)
      .sort({ updatedAt: -1 });

    const { start, end } = utcDayRange();
    const todayNoShows = await Reservation.countDocuments({
      status: "NO_SHOW",
      updatedAt: { $gte: start, $lt: end },
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          todayNoShows,
          gracePeriod: "15 minutes grace threshold",
          lastUpdated: "Live sync with circulation desk",
        },
        records: records.map(toStaffReservation),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve no-shows and cancellations",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// WF-23: Mark Reservation as No-show
// PATCH /api/staff/reservations/:id/no-show
// ---------------------------------------------------------------------------
const markReservationNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    const reservation = await findReservationWithHold(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    // Atomic transition + release-once via the shared lifecycle helper.
    const { applied, reservation: updated } = await applyTerminalStatus(reservation, {
      status: "NO_SHOW",
      set: {
        noShowRecordedAt: new Date(),
        requiresAttention: false,
      },
    });

    if (!applied) {
      return res.status(409).json({
        success: false,
        message: `Reservation ${reservation.reservationId} is already closed (${staffDisplayStatus(
          reservation.status
        )}). No resources were released again.`,
      });
    }

    await logAction(
      staffId || configuredStaffUsername,
      "MARK_NO_SHOW",
      "RESERVATION",
      updated.reservationId,
      `Reservation ${updated.reservationId} marked as NO-SHOW. Resources released.`
    );

    return res.status(200).json({
      success: true,
      message: `Reservation ${updated.reservationId} marked as NO-SHOW. Resources released.`,
      data: await loadStaffReservation(updated._id),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record no-show",
      error: error.message,
    });
  }
};

module.exports = {
  loginStaff,
  getStaffDashboard,
  getStaffReservations,
  getReservationById,
  updateReservationStatus,
  rejectReservation,
  getBooks,
  updateBookAvailability,
  getOccupancy,
  updateSeatStatus,
  getNoShowsAndCancellations,
  markReservationNoShow,
};
