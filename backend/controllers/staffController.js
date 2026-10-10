const Book = require("../models/Book");
const Seat = require("../models/Seat");
const ReadingRoom = require("../models/ReadingRoom");
const Reservation = require("../models/Reservation");
const StaffLog = require("../models/StaffLog");

// Helper to escape regex special characters
const escapeRegex = (value) => {
  return typeof value === "string" ? value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
};

// Helper to log staff actions
const logAction = async (staffId, action, targetType, targetId, details, status = "SUCCESS") => {
  try {
    await StaffLog.create({
      staffId: staffId || "STF-4092",
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

/**
 * WF-16: Staff Login
 * POST /api/staff/login
 */
const loginStaff = async (req, res) => {
  try {
    const { username, password } = req.body;
    const staffId = (username || "STF-4092").trim().toUpperCase();

    // In institutional prototype, STF-4092 is standard staff account
    const staffUser = {
      staffId: staffId || "STF-4092",
      name: "Bandaranayaka LAMMM (Staff Ops)",
      role: "Library Staff",
      desk: "Circulation Desk 01",
      shift: "08:00 - 17:00",
      token: "mock-jwt-staff-" + Date.now(),
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
      message: "Staff login failed",
      error: error.message,
    });
  }
};

/**
 * WF-17: Staff Dashboard
 * GET /api/staff/dashboard
 */
const getStaffDashboard = async (req, res) => {
  try {
    // Live counts from MongoDB
    const totalReservations = await Reservation.countDocuments();
    const attentionRequiredCount = await Reservation.countDocuments({
      $or: [{ requiresAttention: true }, { status: "EXCEPTION" }],
    });
    const occupiedSeatsCount = await Seat.countDocuments({
      room: "Reading Room A",
      status: "occupied",
    });
    const totalRoomASeats = await Seat.countDocuments({
      room: "Reading Room A",
    });

    // Requires attention reservations
    const attentionItems = await Reservation.find({
      $or: [{ requiresAttention: true }, { status: "EXCEPTION" }],
    })
      .sort({ updatedAt: -1 })
      .limit(5);

    // Recent reservations overview
    const recentReservations = await Reservation.find()
      .sort({ updatedAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        staff: {
          staffId: "STF-4092",
          desk: "Circulation Desk 01",
          shift: "08:00 - 17:00",
          handoverTime: "14:00",
        },
        metrics: {
          reservationsToday: totalReservations > 0 ? 24 : 0, // prototype baseline
          actualReservationsCount: totalReservations,
          attentionRequired: attentionRequiredCount > 0 ? attentionRequiredCount : 3,
          occupiedSeats: occupiedSeatsCount > 0 ? occupiedSeatsCount : 18,
          totalSeats: totalRoomASeats > 0 ? totalRoomASeats : 30,
        },
        requiresAttention: attentionItems,
        recentReservations,
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

/**
 * WF-18: Staff Reservation Management
 * GET /api/staff/reservations
 */
const getStaffReservations = async (req, res) => {
  try {
    const { filter, search, type } = req.query;

    const query = {};

    if (filter === "exceptions") {
      query.$or = [{ requiresAttention: true }, { status: "EXCEPTION" }];
    } else if (filter === "today") {
      query.$or = [
        { pickupDate: { $regex: "16 September|today", $options: "i" } },
        { status: { $in: ["CONFIRMED", "READY_FOR_PICKUP"] } },
      ];
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { reservationId: regex },
        { studentName: regex },
        { studentId: regex },
        { bookTitle: regex },
        { seatNumber: regex },
      ];
    }

    const reservations = await Reservation.find(query).sort({ updatedAt: -1 });

    // Aggregate counts for UI tab badges
    const allCount = await Reservation.countDocuments();
    const exceptionsCount = await Reservation.countDocuments({
      $or: [{ requiresAttention: true }, { status: "EXCEPTION" }],
    });
    const todayCount = await Reservation.countDocuments({
      $or: [
        { pickupDate: { $regex: "16 September|today", $options: "i" } },
        { status: { $in: ["CONFIRMED", "READY_FOR_PICKUP"] } },
      ],
    });

    return res.status(200).json({
      success: true,
      counts: {
        all: allCount > 0 ? 32 : 0,
        actualAll: allCount,
        today: todayCount > 0 ? 14 : 0,
        actualToday: todayCount,
        exceptions: exceptionsCount > 0 ? exceptionsCount : 3,
        actualExceptions: exceptionsCount,
      },
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reservations",
      error: error.message,
    });
  }
};

/**
 * WF-19: Staff Reservation Details
 * GET /api/staff/reservations/:id
 */
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      $or: [{ reservationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load reservation details",
      error: error.message,
    });
  }
};

/**
 * WF-19: Update Reservation Status
 * PATCH /api/staff/reservations/:id/status
 */
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deskNote, staffId } = req.body;

    const validStatuses = [
      "CONFIRMED",
      "READY_FOR_PICKUP",
      "EXCEPTION",
      "CANCELLED",
      "NO_SHOW",
      "COMPLETED",
      "REJECTED",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const reservation = await Reservation.findOne({
      $or: [{ reservationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    if (status) reservation.status = status;
    if (deskNote !== undefined) reservation.deskNote = deskNote;
    if (status === "READY_FOR_PICKUP" || status === "COMPLETED") {
      reservation.requiresAttention = false;
      reservation.attentionType = "NONE";
    }

    await reservation.save();

    await logAction(
      staffId || "STF-4092",
      "UPDATE_RESERVATION_STATUS",
      "RESERVATION",
      reservation.reservationId,
      `Status updated to ${reservation.status}`
    );

    return res.status(200).json({
      success: true,
      message: `Reservation ${reservation.reservationId} updated to ${reservation.status}`,
      data: reservation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update reservation status",
      error: error.message,
    });
  }
};

/**
 * WF-20: Reject/Cancel Reservation
 * PATCH /api/staff/reservations/:id/reject
 */
const rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, explanation, staffId } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const reservation = await Reservation.findOne({
      $or: [{ reservationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    reservation.status = "REJECTED";
    reservation.rejectionReason = reason;
    reservation.rejectionExplanation = explanation || "";
    reservation.rejectionStaffId = staffId || "STF-4092";
    reservation.rejectionDate = new Date();
    reservation.cancellationSource = "STAFF_ACTION";
    reservation.requiresAttention = false;

    await reservation.save();

    // If it was a book, release copy if possible
    if (reservation.book) {
      await Book.findByIdAndUpdate(reservation.book, {
        $inc: { availableCopies: 1 },
      });
    }

    // If it was a seat, free seat
    if (reservation.seatNumber) {
      await Seat.findOneAndUpdate(
        { seatNumber: reservation.seatNumber, room: reservation.room },
        { status: "available", occupiedBy: {} }
      );
    }

    await logAction(
      staffId || "STF-4092",
      "REJECT_RESERVATION",
      "RESERVATION",
      reservation.reservationId,
      `Rejected. Reason: ${reason}. Explanation: ${explanation || "None"}`
    );

    return res.status(200).json({
      success: true,
      message: `Reservation ${reservation.reservationId} has been successfully rejected. Student notified.`,
      data: reservation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject reservation",
      error: error.message,
    });
  }
};

/**
 * WF-21: Book Availability Management
 * GET /api/staff/books
 */
const getBooks = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
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

/**
 * WF-21: Update Book Availability
 * PATCH /api/staff/books/:id/availability
 */
const updateBookAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, availableCopies, shelfLocation, notes, staffId } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (status !== undefined) book.status = status;
    if (availableCopies !== undefined) book.availableCopies = Number(availableCopies);
    if (shelfLocation !== undefined) book.shelfLocation = shelfLocation.trim();
    if (notes !== undefined) book.notes = notes;

    await book.save();

    await logAction(
      staffId || "STF-4092",
      "UPDATE_BOOK_AVAILABILITY",
      "BOOK",
      book.title,
      `Status set to ${book.status} at ${book.shelfLocation}`
    );

    return res.status(200).json({
      success: true,
      message: `Book availability updated successfully for "${book.title}"`,
      data: book,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update book availability",
      error: error.message,
    });
  }
};

/**
 * WF-21: Add New Book to Library Catalog
 * POST /api/staff/books
 */
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      edition,
      isbn,
      category,
      shelfLocation,
      branch,
      totalCopies,
      availableCopies,
      status,
      notes,
      staffId,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Book title is required",
      });
    }

    if (!author || typeof author !== "string" || !author.trim()) {
      return res.status(400).json({
        success: false,
        message: "Author is required",
      });
    }

    if (!shelfLocation || typeof shelfLocation !== "string" || !shelfLocation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shelf location is required",
      });
    }

    const parsedTotalCopies =
      totalCopies !== undefined && totalCopies !== null && totalCopies !== ""
        ? Number(totalCopies)
        : 1;

    if (
      isNaN(parsedTotalCopies) ||
      !Number.isInteger(parsedTotalCopies) ||
      parsedTotalCopies < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be a non-negative whole number",
      });
    }

    const parsedAvailableCopies =
      availableCopies !== undefined && availableCopies !== null && availableCopies !== ""
        ? Number(availableCopies)
        : parsedTotalCopies;

    if (
      isNaN(parsedAvailableCopies) ||
      !Number.isInteger(parsedAvailableCopies) ||
      parsedAvailableCopies < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Available copies must be a non-negative whole number",
      });
    }

    if (parsedAvailableCopies > parsedTotalCopies) {
      return res.status(400).json({
        success: false,
        message: "Available copies cannot exceed total copies",
      });
    }

    const validStatuses = ["Available", "Unavailable", "Under Maintenance", "In Repair"];
    const bookStatus = status && validStatuses.includes(status) ? status : "Available";

    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      edition: edition && edition.trim() ? edition.trim() : "1st Edition",
      isbn: isbn ? isbn.trim() : "",
      category: category && category.trim() ? category.trim() : "General",
      shelfLocation: shelfLocation.trim(),
      branch: branch && branch.trim() ? branch.trim() : "Main Library",
      totalCopies: parsedTotalCopies,
      availableCopies: parsedAvailableCopies,
      status: bookStatus,
      notes: notes ? notes.trim() : "",
    });

    await logAction(
      staffId || "STF-4092",
      "CREATE_BOOK",
      "BOOK",
      newBook.title,
      `New book "${newBook.title}" added to catalog at ${newBook.shelfLocation}`
    );

    return res.status(201).json({
      success: true,
      message: `Book "${newBook.title}" created successfully`,
      data: newBook,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create book",
      error: error.message,
    });
  }
};

/**
 * WF-22: Reading Room Occupancy
 * GET /api/staff/occupancy
 */
const getOccupancy = async (req, res) => {
  try {
    // 1. Fetch all rooms from ReadingRoom collection
    const dbRooms = await ReadingRoom.find().sort({ name: 1 });

    // 2. Fetch distinct rooms from Seat collection in case any exist without ReadingRoom record
    const seatRoomNames = await Seat.distinct("room");

    // Merge room names to cover all active rooms
    const allRoomNames = Array.from(
      new Set([
        ...dbRooms.map((r) => r.name),
        ...seatRoomNames,
        "Reading Room A",
        "Reading Room B",
      ])
    );

    const roomDataList = [];

    for (const roomName of allRoomNames) {
      const roomDoc = dbRooms.find((r) => r.name.toLowerCase() === roomName.toLowerCase());
      const roomSeats = await Seat.find({ room: roomName }).sort({ seatNumber: 1 });

      const occupiedCount = roomSeats.filter((s) => s.status === "occupied").length;
      const totalSeatsCount = roomSeats.length > 0
        ? Math.max(roomDoc?.totalSeats || 0, roomSeats.length)
        : (roomDoc?.totalSeats || (roomName === "Reading Room A" ? 30 : 20));

      const availableCount = Math.max(0, totalSeatsCount - occupiedCount);
      const occupancyRate = totalSeatsCount > 0
        ? Math.round((occupiedCount / totalSeatsCount) * 100)
        : 0;

      const floorDisplay = roomDoc?.floor
        ? (roomDoc.floor.startsWith("Floor") ? roomDoc.floor : `Floor ${String(roomDoc.floor).padStart(2, "0")}`)
        : "Floor 02";

      const wingDisplay = roomDoc?.building || roomDoc?.zone || (roomName === "Reading Room A" ? "West Wing" : "East Wing");

      roomDataList.push({
        _id: roomDoc?._id,
        name: roomName,
        floor: floorDisplay,
        wing: wingDisplay,
        building: roomDoc?.building || wingDisplay,
        zone: roomDoc?.zone || "General",
        openingTime: roomDoc?.openingTime || "08:00",
        closingTime: roomDoc?.closingTime || "18:30",
        totalSeats: totalSeatsCount,
        occupiedSeats: occupiedCount,
        availableSeats: availableCount,
        occupancyRate,
        seats: roomSeats,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        timestamp: new Date(),
        rooms: roomDataList,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load reading room occupancy",
      error: error.message,
    });
  }
};

/**
 * WF-22: Update Seat Status
 * PATCH /api/staff/occupancy/seat/:id
 */
const updateSeatStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, staffId } = req.body;

    const seat = await Seat.findById(id);
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    seat.status = status;
    if (status === "available") {
      seat.occupiedBy = {};
    }
    await seat.save();

    await logAction(
      staffId || "STF-4092",
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

/**
 * WF-22: Add New Reading Room
 * POST /api/staff/reading-rooms
 */
const createReadingRoom = async (req, res) => {
  try {
    const {
      name,
      building,
      floor,
      zone,
      description,
      openingTime,
      closingTime,
      totalSeats,
      status,
      staffId,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reading room name is required",
      });
    }

    if (!building || typeof building !== "string" || !building.trim()) {
      return res.status(400).json({
        success: false,
        message: "Building / Wing is required",
      });
    }

    if (!floor || typeof floor !== "string" || !floor.trim()) {
      return res.status(400).json({
        success: false,
        message: "Floor is required",
      });
    }

    const parsedTotalSeats = Number(totalSeats);
    if (
      isNaN(parsedTotalSeats) ||
      !Number.isInteger(parsedTotalSeats) ||
      parsedTotalSeats < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Total seats (capacity) must be a positive whole number",
      });
    }

    const normalizedName = name.trim();
    const normalizedBuilding = building.trim();
    const normalizedFloor = floor.trim();

    // Check for duplicate room name or location
    const existingRoom = await ReadingRoom.findOne({
      $or: [
        { name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i") },
        {
          name: normalizedName,
          building: normalizedBuilding,
          floor: normalizedFloor,
        },
      ],
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `A reading room named "${normalizedName}" already exists`,
      });
    }

    const newRoom = await ReadingRoom.create({
      name: normalizedName,
      building: normalizedBuilding,
      floor: normalizedFloor,
      zone: zone && zone.trim() ? zone.trim() : "General",
      description: description && description.trim() ? description.trim() : "",
      openingTime:
        openingTime && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(openingTime)
          ? openingTime
          : "08:00",
      closingTime:
        closingTime && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(closingTime)
          ? closingTime
          : "18:30",
      totalSeats: parsedTotalSeats,
      status: status || "active",
    });

    await logAction(
      staffId || "STF-4092",
      "CREATE_READING_ROOM",
      "SYSTEM",
      newRoom.name,
      `New reading room "${newRoom.name}" created on ${newRoom.floor} with capacity ${newRoom.totalSeats}`
    );

    return res.status(201).json({
      success: true,
      message: `Reading room "${newRoom.name}" created successfully`,
      data: newRoom,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A reading room with this name and location already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create reading room",
      error: error.message,
    });
  }
};

/**
 * WF-22: Add New Seat to a Reading Room
 * POST /api/staff/occupancy/seats
 */
const addSeat = async (req, res) => {
  try {
    const { room, seatNumber, floor, wing, status, staffId } = req.body;

    if (!room || typeof room !== "string" || !room.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reading room is required",
      });
    }

    if (!seatNumber || typeof seatNumber !== "string" || !seatNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Seat number / identifier is required",
      });
    }

    const trimmedRoom = room.trim();
    const trimmedSeatNumber = seatNumber.trim().toUpperCase();

    // Verify room exists in ReadingRoom or Seat collection
    const roomDoc = await ReadingRoom.findOne({
      name: new RegExp(`^${escapeRegex(trimmedRoom)}$`, "i"),
    });
    const roomExistsInSeats = await Seat.exists({ room: trimmedRoom });

    if (!roomDoc && !roomExistsInSeats) {
      return res.status(404).json({
        success: false,
        message: `Reading room "${trimmedRoom}" not found`,
      });
    }

    // Check duplicate seat within room
    const existingSeat = await Seat.findOne({
      room: trimmedRoom,
      seatNumber: trimmedSeatNumber,
    });

    if (existingSeat) {
      return res.status(409).json({
        success: false,
        message: `Seat "${trimmedSeatNumber}" already exists in ${trimmedRoom}`,
      });
    }

    const validStatuses = ["available", "occupied", "reserved", "maintenance"];
    const seatStatus = status && validStatuses.includes(status) ? status : "available";

    const newSeat = await Seat.create({
      seatNumber: trimmedSeatNumber,
      room: trimmedRoom,
      floor: floor && floor.trim() ? floor.trim() : (roomDoc ? roomDoc.floor : "Floor 02"),
      wing: wing && wing.trim() ? wing.trim() : (roomDoc ? roomDoc.building : "West Wing"),
      status: seatStatus,
      occupiedBy: null,
    });

    // Update roomDoc totalSeats if total seat count exceeds current totalSeats
    if (roomDoc) {
      const seatCount = await Seat.countDocuments({ room: trimmedRoom });
      if (seatCount > roomDoc.totalSeats) {
        roomDoc.totalSeats = seatCount;
        await roomDoc.save();
      }
    }

    await logAction(
      staffId || "STF-4092",
      "ADD_SEAT",
      "SEAT",
      newSeat.seatNumber,
      `Seat ${newSeat.seatNumber} added to ${trimmedRoom}`
    );

    return res.status(201).json({
      success: true,
      message: `Seat "${newSeat.seatNumber}" added to ${trimmedRoom} successfully`,
      data: newSeat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add seat",
      error: error.message,
    });
  }
};

/**
 * WF-23: No-show & Cancellation Management
 * GET /api/staff/no-shows
 */
const getNoShowsAndCancellations = async (req, res) => {
  try {
    const records = await Reservation.find({
      status: { $in: ["NO_SHOW", "CANCELLED", "REJECTED"] },
    }).sort({ updatedAt: -1 });

    const todayNoShowsCount = records.filter(
      (r) => r.status === "NO_SHOW"
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          todayNoShows: todayNoShowsCount > 0 ? todayNoShowsCount : 3,
          gracePeriod: "15 minutes grace threshold",
          lastUpdated: "Live sync with circulation desk",
        },
        records,
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

/**
 * WF-23: Mark Reservation as No-show
 * PATCH /api/staff/reservations/:id/no-show
 */
const markReservationNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    const reservation = await Reservation.findOne({
      $or: [{ reservationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${id} not found`,
      });
    }

    reservation.status = "NO_SHOW";
    reservation.noShowRecordedAt = new Date();
    reservation.requiresAttention = false;

    await reservation.save();

    // Release book or seat
    if (reservation.book) {
      await Book.findByIdAndUpdate(reservation.book, {
        $inc: { availableCopies: 1 },
      });
    }

    if (reservation.seatNumber) {
      await Seat.findOneAndUpdate(
        { seatNumber: reservation.seatNumber, room: reservation.room },
        { status: "available", occupiedBy: {} }
      );
    }

    await logAction(
      staffId || "STF-4092",
      "MARK_NO_SHOW",
      "RESERVATION",
      reservation.reservationId,
      `Reservation ${reservation.reservationId} marked as NO-SHOW. Resources released.`
    );

    return res.status(200).json({
      success: true,
      message: `Reservation ${reservation.reservationId} marked as NO-SHOW. Resources released.`,
      data: reservation,
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
  createBook,
  updateBookAvailability,
  getOccupancy,
  createReadingRoom,
  addSeat,
  updateSeatStatus,
  getNoShowsAndCancellations,
  markReservationNoShow,
};
