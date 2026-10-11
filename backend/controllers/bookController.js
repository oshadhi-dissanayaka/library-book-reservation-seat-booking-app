const mongoose = require("mongoose");
const Book = require("../models/Book");
const { releaseExpiredBookHolds } = require("../services/bookHoldService");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getBooks = async (req, res) => {
  try {
    await releaseExpiredBookHolds();
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const filter = {};

    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { title: expression },
        { author: expression },
        { isbn: expression },
        { category: expression },
        { callNumber: expression },
      ];
    }

    if (category && category !== "All") filter.category = category;
    if (req.query.available === "true") filter.availableCopies = { $gt: 0 };

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 50);
    const [items, total, categories] = await Promise.all([
      Book.find(filter).sort({ title: 1 }).limit(limit).lean(),
      Book.countDocuments(filter),
      Book.distinct("category"),
    ]);

    res.json({ items, total, categories: categories.sort((left, right) => left.localeCompare(right)) });
  } catch (error) {
    res.status(500).json({ message: "Unable to search the book catalog." });
  }
};

const getBookById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid book ID." });
  }

  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) return res.status(404).json({ message: "Book not found." });
    return res.json(book);
  } catch (error) {
    return res.status(500).json({ message: "Unable to load this book." });
  }
};

module.exports = { getBooks, getBookById };