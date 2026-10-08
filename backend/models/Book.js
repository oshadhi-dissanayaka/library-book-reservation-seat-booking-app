const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    publisher: { type: String, trim: true },
    publicationYear: { type: Number, min: 0 },
    callNumber: { type: String, trim: true },
    library: { type: String, required: true, trim: true },
    shelf: { type: String, trim: true },
    description: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    totalCopies: { type: Number, required: true, min: 0, default: 1 },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
      validate: {
        validator(value) {
          return value <= this.totalCopies;
        },
        message: "Available copies cannot exceed total copies.",
      },
    },
  },
  { timestamps: true }
);

bookSchema.index({ isbn: 1 }, { unique: true, sparse: true });
bookSchema.index({ title: "text", author: "text", isbn: "text" });

module.exports = mongoose.models.Book || mongoose.model("Book", bookSchema);