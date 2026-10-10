const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
  quiet: true,
});

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

async function startServer() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGO_URI is missing. Add your MongoDB Atlas connection string to backend/.env."
    );
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new Error("MONGO_URI must start with mongodb:// or mongodb+srv://.");
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    // Do not log the URI or raw driver errors, which can contain credentials.
    const reason = error.code === 18
      ? "Atlas authentication failed. Check the database username and password."
      : "Check the Atlas connection string, database user, Network Access IP list, and network/DNS access.";
    throw new Error(`MongoDB connection failed. ${reason}`);
  }

  console.log("MongoDB connected successfully");
  const port = process.env.PORT || 5000;
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
