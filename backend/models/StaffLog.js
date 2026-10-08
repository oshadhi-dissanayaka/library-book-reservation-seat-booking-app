const mongoose = require("mongoose");

const staffLogSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      default: "STF-4092",
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ["SYSTEM", "RESERVATION", "BOOK", "SEAT"],
      default: "SYSTEM",
    },
    targetId: {
      type: String,
      default: "",
    },
    details: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
    collection: "stafflogs",
  }
);

module.exports =
  mongoose.models.StaffLog ||
  mongoose.model("StaffLog", staffLogSchema);
