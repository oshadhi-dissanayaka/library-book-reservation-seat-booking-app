const ReadingRoom = require("../models/ReadingRoom");

/**
 * Escapes user input so it can be safely used inside a RegExp.
 * Prevents invalid patterns (e.g. search="(") from throwing.
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/reading-rooms
 * GET /api/reading-rooms?search=Reading%20Room%20A
 *
 * WF-09 Reading Room Search — returns all active reading rooms,
 * optionally filtered by a search term matched against name, building and zone.
 * Date/time availability filtering is intentionally NOT included yet (WF-10).
 */
const getReadingRooms = async (req, res) => {
  try {
    const rawSearch = req.query.search;

    // Reject repeated/non-string query values (Express gives an array for ?search=a&search=b)
    if (rawSearch !== undefined && typeof rawSearch !== "string") {
      return res.status(400).json({
        message: "Invalid search parameter",
      });
    }

    const search = typeof rawSearch === "string" ? rawSearch.trim() : "";

    // Only rooms the students can actually book are searchable.
    const filter = { status: "active" };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { building: regex }, { zone: regex }];
    }

    const readingRooms = await ReadingRoom.find(filter).sort({ name: 1 });

    return res.status(200).json({
      count: readingRooms.length,
      search,
      readingRooms,
    });
  } catch (error) {
    // Invalid regex / cast issues -> bad request; anything else -> server error.
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        message: "Invalid search parameter",
      });
    }

    return res.status(500).json({
      message: "Failed to load reading rooms",
      error: error.message,
    });
  }
};

module.exports = {
  getReadingRooms,
};
