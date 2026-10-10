const express = require("express");

const { getReadingRooms } = require("../controllers/readingRoomController");
const { createReadingRoom } = require("../controllers/staffController");

const router = express.Router();

router.get("/", getReadingRooms);
router.post("/", createReadingRoom);

module.exports = router;
