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
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    publicationYear: {
      type: Number,
      min: 0,
    },
    callNumber: {
      type: String,
      trim: true,
    },
    library: {
      type: String,
      default: "Main Library",
      trim: true,
    },
    shelf: {
      type: String,
      trim: true,
    },
    shelfLocation: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      default: "Main Library",
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    availableCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
      validate: {
        validator(value) {
          return value <= this.totalCopies;
        },
        message: "Available copies cannot exceed total copies.",
      },
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

bookSchema.index({ isbn: 1 }, { unique: true, sparse: true });
bookSchema.index({ title: "text", author: "text", isbn: "text" });

module.exports =
  mongoose.models.Book || mongoose.model("Book", bookSchema);