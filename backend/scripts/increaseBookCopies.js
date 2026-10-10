const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("../models/Book");

const COPIES_TO_ADD = 5;

const increaseBookCopies = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it in backend/.env before running this script.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await Book.updateMany(
    {},
    { $inc: { totalCopies: COPIES_TO_ADD, availableCopies: COPIES_TO_ADD } }
  );
  console.log(`Added ${COPIES_TO_ADD} total and available copies to ${result.modifiedCount} books.`);
};

increaseBookCopies()
  .catch((error) => {
    console.error(`Copy increase failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });