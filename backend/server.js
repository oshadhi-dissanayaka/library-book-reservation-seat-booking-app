const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const managementRoutes = require("./routes/managementRoutes");
const staffRoutes = require("./routes/staffRoutes");
const readingRoomRoutes = require("./routes/readingRoomRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/management", managementRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/reading-rooms", readingRoomRoutes);
app.use("/api/reservations", reservationRoutes);

// Test route
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