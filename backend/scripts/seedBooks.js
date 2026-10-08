const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("../models/Book");

const sampleBooks = [
  {
    title: "Database Systems: A Practical Approach",
    author: "Thomas Connolly, Carolyn Begg",
    isbn: "9780132943260",
    category: "Database Systems",
    publisher: "Pearson",
    publicationYear: 2014,
    callNumber: "QA76.9.D3 C66",
    library: "Main Library",
    shelf: "B-12",
    description: "A practical introduction to database design, implementation, and management.",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780132943260-L.jpg",
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: "Fundamentals of Database Systems",
    author: "Ramez Elmasri, Shamkant Navathe",
    isbn: "9780133970777",
    category: "Database Systems",
    publisher: "Pearson",
    publicationYear: 2016,
    callNumber: "QA76.9.D3 E45",
    library: "Main Library",
    shelf: "B-14",
    description: "Core database concepts, modeling, SQL, and database system implementation.",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780133970777-L.jpg",
    totalCopies: 6,
    availableCopies: 4,
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    isbn: "9780078022159",
    category: "Database Systems",
    publisher: "McGraw Hill",
    publicationYear: 2019,
    callNumber: "QA76.9.D3 S54",
    library: "Engineering Library",
    shelf: "E-04",
    description: "A comprehensive guide to database design, relational systems, and SQL.",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780078022159-L.jpg",
    totalCopies: 5,
    availableCopies: 3,
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Software Engineering",
    publisher: "Prentice Hall",
    publicationYear: 2008,
    callNumber: "QA76.76.D47 M37",
    library: "Engineering Library",
    shelf: "E-08",
    description: "A handbook of practical principles for writing readable, maintainable code.",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
    totalCopies: 4,
    availableCopies: 2,
  },
  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
    isbn: "9781119320913",
    category: "Computer Science",
    publisher: "Wiley",
    publicationYear: 2018,
    callNumber: "QA76.76.O63 S54",
    library: "Main Library",
    shelf: "C-06",
    description: "Foundational concepts in modern operating system design and implementation.",
    coverImage: "https://covers.openlibrary.org/b/isbn/9781119320913-L.jpg",
    totalCopies: 7,
    availableCopies: 5,
  },
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    isbn: "9780135957059",
    category: "Software Engineering",
    publisher: "Addison-Wesley",
    publicationYear: 2019,
    callNumber: "QA76.6 T475",
    library: "Main Library",
    shelf: "C-11",
    description: "Practical techniques and habits for effective software development.",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
  },
];

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it in backend/.env before seeding.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const results = await Promise.all(
    sampleBooks.map(async (book) => {
      const document = new Book(book);
      await document.validate();
      return Book.updateOne(
        { isbn: book.isbn },
        { $setOnInsert: document.toObject() },
        { upsert: true }
      );
    })
  );
  const inserted = results.reduce((count, result) => count + result.upsertedCount, 0);
  console.log(`Catalog seed complete. Added ${inserted} new books; existing records were left unchanged.`);
};

seed()
  .catch((error) => {
    console.error(`Catalog seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });