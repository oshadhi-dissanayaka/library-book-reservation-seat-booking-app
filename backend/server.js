const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

// Routes
const managementRoutes = require("./routes/managementRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const seatReservationRoutes = require("./routes/seatReservationRoutes");
const staffRoutes = require("./routes/staffRoutes");
const readingRoomRoutes = require("./routes/readingRoomRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Member 4 - Management & Reports
app.use("/api/management", managementRoutes);

// Member 1 - Books & Book Reservations
app.use("/api/books", bookRoutes);
app.use("/api/reservations", reservationRoutes);

// Member 2 - Reading Rooms & Seat Reservations
app.use("/api/reading-rooms", readingRoomRoutes);
app.use("/api/seat-reservations", seatReservationRoutes);

// Member 3 - Library Staff
app.use("/api/staff", staffRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "Library Book Reservation API is running",
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});