const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    edition: {
      type: String,
      default: "1st Edition",
    },
    isbn: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
    },
    shelfLocation: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      default: "Main Library",
    },
    totalCopies: {
      type: Number,
      default: 1,
      min: 0,
    },
    availableCopies: {
      type: Number,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Available", "Unavailable", "Under Maintenance", "In Repair"],
      default: "Available",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "books",
  }
);

module.exports = mongoose.models.Book || mongoose.model("Book", bookSchema);
