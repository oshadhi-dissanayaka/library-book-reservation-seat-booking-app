const express = require("express");

const { getReadingRooms } = require("../controllers/readingRoomController");

const router = express.Router();

router.get("/", getReadingRooms);

module.exports = router;
