const mongoose = require("mongoose");

/**
 * ReadingRoom — WF-09 Reading Room Search (IT3060 HCI Milestone 03).
 *
 * Contains only the fields needed for the Reading Room Search screen and the
 * later Seat Availability workflow (WF-10). Seats are NOT modelled here;
 * totalSeats is the room capacity shown while browsing availability.
 *
 * openingTime / closingTime are stored as 24-hour "HH:mm" strings
 * ("08:00" = 8:00 AM, "18:30" = 6:30 PM) so 2-hour slot blocks can be
 * generated and compared easily. The UI can format them as "08:00 AM".
 */
const readingRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      maxlength: [80, "Room name cannot exceed 80 characters"],
    },
    building: {
      type: String,
      required: [true, "Building is required"],
      trim: true,
      maxlength: [80, "Building cannot exceed 80 characters"],
    },
    floor: {
      type: String,
      required: [true, "Floor is required"],
      trim: true,
      maxlength: [30, "Floor cannot exceed 30 characters"],
    },
    zone: {
      type: String,
      trim: true,
      default: "General",
      maxlength: [60, "Zone cannot exceed 60 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    openingTime: {
      type: String,
      default: "08:00",
      match: [
        /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
        "openingTime must be 24-hour HH:mm (e.g. 08:00)",
      ],
    },
    closingTime: {
      type: String,
      default: "18:30",
      match: [
        /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
        "closingTime must be 24-hour HH:mm (e.g. 18:30)",
      ],
      validate: {
        validator: function (value) {
          // Skip when the other field is not present (e.g. partial updates).
          if (!value || typeof this.openingTime !== "string") {
            return true;
          }
          // Zero-padded HH:mm strings compare correctly as text.
          return value > this.openingTime;
        },
        message: "closingTime must be later than openingTime",
      },
    },
    totalSeats: {
      type: Number,
      required: [true, "totalSeats is required"],
      min: [1, "totalSeats must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "totalSeats must be a whole number",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "maintenance"],
        message: "status must be one of: active, inactive, maintenance",
      },
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent duplicate rooms at the same name + building + floor.
readingRoomSchema.index(
  { name: 1, building: 1, floor: 1 },
  { unique: true, name: "uniq_room_location" }
);

const ReadingRoom = mongoose.model("ReadingRoom", readingRoomSchema);

module.exports = ReadingRoom;
