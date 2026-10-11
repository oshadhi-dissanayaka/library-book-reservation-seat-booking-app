const express = require("express");
const { getBookById, getBooks } = require("../controllers/bookController");

const router = express.Router();

router.get("/", getBooks);
router.get("/:id", getBookById);

module.exports = router;