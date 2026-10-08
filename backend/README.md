# Book Search and Reservation API

## Setup

Create `backend/.env` from `.env.example` and set `MONGO_URI` to the MongoDB Atlas connection string. From `backend/`, run `npm ci` and `node server.js`. The API listens on port `5001` by default.

In Expo Go development, the app derives the API host from Expo's development host and uses port `5001`. Keep the phone and computer on the same network. Set `EXPO_PUBLIC_API_URL` in `frontend/.env` only when you need to override the API base URL; it must end in `/api`.

## Catalog Data

The catalog is read from the MongoDB `books` collection. The app never falls back to hard-coded results. To insert a small development catalog into Atlas, run `node scripts/seedBooks.js` from `backend/`. The script is opt-in and idempotent; it does not overwrite existing book records or available-copy counts. For production, the team's library-management interface owns catalog entry. Each document needs `title`, `author`, `category`, `library`, `totalCopies`, and `availableCopies`; optional fields are `isbn`, `publisher`, `publicationYear`, `callNumber`, `shelf`, `description`, and `coverImage`.

`availableCopies` must be between zero and `totalCopies`. `coverImage`, when present, should be a URL accessible to the mobile device.

To add five copies to every existing catalog record, run `node scripts/increaseBookCopies.js` from `backend/`. This increases both total and available copies, preserving the number currently checked out. Run it once; running it again adds another five per book.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/books?search=&category=&available=true` | Search catalog records and return categories |
| `GET` | `/api/books/:id` | Read one catalog record |
| `POST` | `/api/reservations` | Create a book reservation and decrement available copies |
| `GET` | `/api/reservations?patronId=` | List reservations for a student/library ID |
| `PATCH` | `/api/reservations/:id` | Change an active reservation's pickup date |
| `DELETE` | `/api/reservations/:id?patronId=` | Cancel a reservation and release its copy |

The reservation response includes the generated, unique `reservationId` shown on the student's pass.

Create payload:

```json
{
  "bookId": "<MongoDB book id>",
  "patronId": "<student or library id>",
  "pickupDate": "<YYYY-MM-DD within six days>",
  "pickupLocation": "<library or circulation desk>",
  "termsAccepted": true
}
```

Update payload:

```json
{
  "patronId": "<student or library id>",
  "pickupDate": "<YYYY-MM-DD within six days>"
}
```

Expired reservations are marked and their copies returned when catalog or reservation requests run. A reservation expires 48 hours after its selected pickup date.

## Shared Reservation Model

Book and future seat reservations use the same `Reservation` model. Book records use `resourceType: "book"`, `bookId`, `pickupDate`, and `pickupLocation`. Seat records use `resourceType: "seat"`, `readingRoomId`, `seatId`, `seatStartAt`, and `seatEndAt`. Both use `patronId` and the shared `status` field.

There is no User/authentication model in this branch. The current screens use the supplied student/library ID to find reservations; this is not identity verification. Integrate the team's authentication contract before using these endpoints for sensitive or production data.