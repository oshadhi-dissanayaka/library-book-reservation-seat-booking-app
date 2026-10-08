const Book = require("../models/Book");
const Reservation = require("../models/Reservation");

const releaseExpiredBookHolds = async (filters = {}) => {
  const query = {
    resourceType: "book",
    status: "confirmed",
    holdExpiresAt: { $lte: new Date() },
  };
  if (filters.bookId) query.bookId = filters.bookId;
  if (filters.patronId) query.patronId = filters.patronId;

  const expired = await Reservation.find(query)
    .sort({ holdExpiresAt: 1 })
    .select("_id")
    .limit(200)
    .lean();

  for (const reservation of expired) {
    const updated = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: "confirmed" },
      { $set: { status: "expired" }, $unset: { activeBookKey: 1 } },
      { returnDocument: "after" }
    ).select("bookId");

    if (updated?.bookId) {
      await Book.updateOne({ _id: updated.bookId }, { $inc: { availableCopies: 1 } });
    }
  }
};

module.exports = { releaseExpiredBookHolds };