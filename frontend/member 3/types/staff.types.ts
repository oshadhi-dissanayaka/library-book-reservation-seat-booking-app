export type ReservationType = 'Book' | 'Seat';

export type ReservationStatus =
  | 'CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'EXCEPTION'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'COMPLETED'
  | 'REJECTED';

export type AttentionType = 'NONE' | 'PENDING_REVIEW' | 'DAMAGED_REPORT' | 'OVERDUE' | 'EXCEPTION';

export interface Reservation {
  _id: string;
  reservationId: string;
  type: ReservationType;
  studentId: string;
  studentName: string;
  studentProgram?: string;
  book?: string;
  bookTitle?: string;
  bookSubtitle?: string;
  bookAuthor?: string;
  bookEdition?: string;
  bookShelf?: string;
  pickupDate?: string;
  pickupLocation?: string;
  loanDuration?: string;
  seat?: string;
  seatNumber?: string;
  room?: string;
  timeSlot?: string;
  status: ReservationStatus;
  requiresAttention: boolean;
  attentionType?: AttentionType;
  attentionReason?: string;
  deskNote?: string;
  rejectionReason?: string;
  rejectionExplanation?: string;
  rejectionStaffId?: string;
  rejectionDate?: string;
  cancellationSource?: string;
  noShowRecordedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookStatus = 'Available' | 'Unavailable' | 'Under Maintenance' | 'In Repair';

export interface Book {
  _id: string;
  title: string;
  author: string;
  edition?: string;
  isbn?: string;
  category?: string;
  shelfLocation: string;
  branch?: string;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatOccupant {
  studentId?: string;
  studentName?: string;
  reservationId?: string;
  startTime?: string;
  endTime?: string;
}

export interface Seat {
  _id: string;
  seatNumber: string;
  room: string;
  floor?: string;
  wing?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  occupiedBy?: SeatOccupant;
}

export interface ReadingRoomInfo {
  _id?: string;
  name: string;
  floor: string;
  wing: string;
  building?: string;
  zone?: string;
  openingTime?: string;
  closingTime?: string;
  description?: string;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  occupancyRate: number;
  seats: Seat[];
}

export interface CreateBookPayload {
  title: string;
  author: string;
  edition?: string;
  isbn?: string;
  category?: string;
  shelfLocation: string;
  branch?: string;
  totalCopies: number;
  availableCopies?: number;
  status?: BookStatus;
  notes?: string;
  staffId?: string;
}

export interface CreateReadingRoomPayload {
  name: string;
  building: string;
  floor: string;
  zone?: string;
  totalSeats: number;
  openingTime?: string;
  closingTime?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  staffId?: string;
}

export interface AddSeatPayload {
  room: string;
  seatNumber: string;
  floor?: string;
  wing?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  staffId?: string;
}

export interface StaffUser {
  staffId: string;
  name: string;
  role: string;
  desk: string;
  shift: string;
  token?: string;
}

export interface StaffDashboardData {
  staff: {
    staffId: string;
    desk: string;
    shift: string;
    handoverTime: string;
  };
  metrics: {
    reservationsToday: number;
    actualReservationsCount: number;
    attentionRequired: number;
    occupiedSeats: number;
    totalSeats: number;
  };
  requiresAttention: Reservation[];
  recentReservations: Reservation[];
}

export interface NoShowsSummaryData {
  summary: {
    todayNoShows: number;
    gracePeriod: string;
    lastUpdated: string;
  };
  records: Reservation[];
}
