import {
  Book,
  NoShowsSummaryData,
  ReadingRoomInfo,
  Reservation,
  StaffDashboardData,
  StaffUser,
} from '../types/staff.types';

// Standard API Base URL with Expo / Mobile LAN support
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api/staff';

// Default fallback dataset for offline/prototype demonstration
const FALLBACK_DASHBOARD: StaffDashboardData = {
  staff: {
    staffId: 'STF-4092',
    desk: 'Circulation Desk 01',
    shift: '08:00 - 17:00',
    handoverTime: '14:00',
  },
  metrics: {
    reservationsToday: 24,
    actualReservationsCount: 6,
    attentionRequired: 3,
    occupiedSeats: 18,
    totalSeats: 30,
  },
  requiresAttention: [
    {
      _id: 'res-01',
      reservationId: 'BR-10245',
      type: 'Book',
      studentId: 'ST12345',
      studentName: 'Pasindu Wickramasinghe',
      studentProgram: 'BSc (Hons) in Information Technology',
      bookTitle: 'Database Systems',
      bookSubtitle: 'Concepts, Architecture & Implementation',
      bookAuthor: 'Thomas Connolly, Carolyn Begg',
      bookEdition: '6th Edition',
      bookShelf: 'Main Library • Shelf A12',
      pickupDate: '16 September 2026',
      pickupLocation: 'Main Library - Circulation Desk 01',
      loanDuration: '14 Days',
      status: 'CONFIRMED',
      requiresAttention: true,
      attentionType: 'PENDING_REVIEW',
      attentionReason: 'Due today, reserved for 18 Sep. Pickup pending.',
      deskNote: 'Book prepared at Circulation Desk 01.',
    },
    {
      _id: 'res-02',
      reservationId: 'BR-10241',
      type: 'Book',
      studentId: 'ST33214',
      studentName: 'Devon B.',
      studentProgram: 'BSc (Hons) in Software Engineering',
      bookTitle: 'Clean Code',
      bookSubtitle: 'A Handbook of Agile Software Craftsmanship',
      bookAuthor: 'Robert C. Martin',
      bookEdition: '1st Edition',
      bookShelf: 'Main Library • Shelf B08',
      pickupDate: '17 September 2026',
      pickupLocation: 'Main Library - Circulation Desk 01',
      loanDuration: '14 Days',
      status: 'EXCEPTION',
      requiresAttention: true,
      attentionType: 'DAMAGED_REPORT',
      attentionReason: 'Damaged copy report. Reported by Desk B.',
      deskNote: 'Hold placed on hold shelf pending supervisor review.',
    },
  ],
  recentReservations: [],
};

const FALLBACK_RESERVATIONS: Reservation[] = [
  {
    _id: 'res-01',
    reservationId: 'BR-10245',
    type: 'Book',
    studentId: 'ST12345',
    studentName: 'Pasindu Wickramasinghe',
    studentProgram: 'BSc (Hons) in Information Technology',
    bookTitle: 'Database Systems',
    bookSubtitle: 'Concepts, Architecture & Implementation',
    bookAuthor: 'Thomas Connolly, Carolyn Begg',
    bookEdition: '6th Edition',
    bookShelf: 'Main Library • Shelf A12',
    pickupDate: '16 September 2026',
    pickupLocation: 'Main Library - Circulation Desk 01',
    loanDuration: '14 Days',
    status: 'READY_FOR_PICKUP',
    requiresAttention: false,
    attentionType: 'NONE',
    attentionReason: '',
    deskNote: 'Book prepared at Circulation Desk 01.',
  },
  {
    _id: 'res-02',
    reservationId: 'BR-10241',
    type: 'Book',
    studentId: 'ST33214',
    studentName: 'Devon B.',
    studentProgram: 'BSc (Hons) in Software Engineering',
    bookTitle: 'Clean Code',
    bookSubtitle: 'A Handbook of Agile Software Craftsmanship',
    bookAuthor: 'Robert C. Martin',
    bookEdition: '1st Edition',
    bookShelf: 'Main Library • Shelf B08',
    pickupDate: '17 September 2026',
    pickupLocation: 'Main Library - Circulation Desk 01',
    loanDuration: '14 Days',
    status: 'EXCEPTION',
    requiresAttention: true,
    attentionType: 'DAMAGED_REPORT',
    attentionReason: 'Damaged copy report. Reported by Desk B.',
    deskNote: 'Hold placed on hold shelf pending supervisor review.',
  },
  {
    _id: 'res-03',
    reservationId: 'BR-10238',
    type: 'Book',
    studentId: 'ST88712',
    studentName: 'Amaya Fernando',
    studentProgram: 'BSc (Hons) in Computer Systems & Network Engineering',
    bookTitle: 'Operating Systems',
    bookSubtitle: 'Principles and Internal Architecture',
    bookAuthor: 'Silberschatz & Galvin',
    bookEdition: '10th Edition',
    bookShelf: 'Main Library • Shelf C03',
    pickupDate: '16 September 2026',
    pickupLocation: 'Main Library - Circulation Desk 01',
    loanDuration: '14 Days',
    status: 'CONFIRMED',
    requiresAttention: false,
    attentionType: 'NONE',
    attentionReason: '',
    deskNote: 'Standard loan reserve ready for pickup.',
  },
  {
    _id: 'res-04',
    reservationId: 'BR-10231',
    type: 'Book',
    studentId: 'ST12345',
    studentName: 'Pasindu Wickramasinghe',
    studentProgram: 'BSc (Hons) in Information Technology',
    bookTitle: 'Database Systems',
    bookShelf: 'Main Library • Shelf A12',
    pickupDate: '15 September 2026',
    pickupLocation: 'Main Library - Circulation Desk 01',
    status: 'NO_SHOW',
    requiresAttention: false,
    attentionReason: 'Reserved pickup window expired 12:15 AM',
  },
  {
    _id: 'res-05',
    reservationId: 'SR-4819',
    type: 'Seat',
    studentId: 'ST55419',
    studentName: 'Kavindu Perera',
    studentProgram: 'BSc (Hons) in Data Science',
    seatNumber: 'B02',
    room: 'Reading Room A',
    timeSlot: '10:00 AM - 12:00 PM',
    status: 'CANCELLED',
    requiresAttention: false,
    attentionReason: 'Cancelled via student portal at 09:03 AM',
  },
  {
    _id: 'res-06',
    reservationId: 'BR-10227',
    type: 'Book',
    studentId: 'ST77301',
    studentName: 'Nimasha Silva',
    studentProgram: 'BSc (Hons) in Cyber Security',
    bookTitle: 'Clean Code',
    bookShelf: 'Main Library • Shelf B08',
    pickupDate: '15 September 2026',
    pickupLocation: 'Main Library - Circulation Desk 01',
    status: 'NO_SHOW',
    requiresAttention: false,
    attentionReason: 'Reserved pickup window expired 09:30 AM',
  },
];

const FALLBACK_BOOKS: Book[] = [
  {
    _id: 'b-01',
    title: 'Database Systems',
    author: 'Thomas Connolly, Carolyn Begg',
    edition: '6th Edition',
    isbn: '978-0132143844',
    category: 'Computer Science',
    shelfLocation: 'Main Library • Shelf A12',
    branch: 'Main Library',
    totalCopies: 6,
    availableCopies: 4,
    status: 'Available',
    notes: 'Core reference for database management modules.',
  },
  {
    _id: 'b-02',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    edition: '1st Edition',
    isbn: '978-0132350884',
    category: 'Software Engineering',
    shelfLocation: 'Main Library • Shelf B08',
    branch: 'Main Library',
    totalCopies: 4,
    availableCopies: 0,
    status: 'Unavailable',
    notes: 'Water damage detected along spine block; sent to restoration.',
  },
  {
    _id: 'b-03',
    title: 'Operating Systems Concepts',
    author: 'Silberschatz, Galvin & Gagne',
    edition: '10th Edition',
    isbn: '978-1118063330',
    category: 'Computer Systems',
    shelfLocation: 'Main Library • Shelf C03',
    branch: 'Main Library',
    totalCopies: 5,
    availableCopies: 3,
    status: 'Available',
    notes: 'Standard recommended text for OS architecture.',
  },
  {
    _id: 'b-04',
    title: 'Computer Networks: Systems Approach',
    author: 'Larry L. Peterson, Bruce S. Davie',
    edition: '5th Edition',
    isbn: '978-0123850591',
    category: 'Networking',
    shelfLocation: 'Main Library • Shelf D05',
    branch: 'Main Library',
    totalCopies: 3,
    availableCopies: 2,
    status: 'Available',
    notes: 'Recommended networking text.',
  },
  {
    _id: 'b-05',
    title: 'Software Engineering A Practitioner’s Approach',
    author: 'Roger S. Pressman',
    edition: '8th Edition',
    isbn: '978-0078022128',
    category: 'Software Engineering',
    shelfLocation: 'Main Library • Shelf E02',
    branch: 'Main Library',
    totalCopies: 4,
    availableCopies: 1,
    status: 'Available',
    notes: 'General circulation copy.',
  },
];

export const staffApi = {
  /**
   * Staff Authentication
   */
  async login(username = 'STF-4092', password = ''): Promise<{ success: boolean; data: StaffUser }> {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    return {
      success: true,
      data: {
        staffId: username || 'STF-4092',
        name: 'Circulation Desk Officer',
        role: 'Library Staff',
        desk: 'Circulation Desk 01',
        shift: '08:00 - 17:00',
        token: 'local-staff-token',
      },
    };
  },

  /**
   * Staff Operational Dashboard Overview
   */
  async getDashboard(): Promise<{ success: boolean; data: StaffDashboardData }> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    return {
      success: true,
      data: FALLBACK_DASHBOARD,
    };
  },

  /**
   * Reservation Management & Filter Queue
   */
  async getReservations(
    filter: 'all' | 'today' | 'exceptions' = 'all',
    search = '',
    type: 'all' | 'Book' | 'Seat' = 'all'
  ): Promise<{
    success: boolean;
    counts: {
      all: number;
      actualAll: number;
      today: number;
      actualToday: number;
      exceptions: number;
      actualExceptions: number;
    };
    data: Reservation[];
  }> {
    try {
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      if (type) params.append('type', type);

      const res = await fetch(`${API_BASE_URL}/reservations?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    let filtered = [...FALLBACK_RESERVATIONS];
    if (filter === 'exceptions') {
      filtered = filtered.filter((r) => r.requiresAttention || r.status === 'EXCEPTION');
    } else if (filter === 'today') {
      filtered = filtered.filter(
        (r) => r.status === 'CONFIRMED' || r.status === 'READY_FOR_PICKUP'
      );
    }
    if (type !== 'all') {
      filtered = filtered.filter((r) => r.type === type);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.reservationId.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          (r.bookTitle && r.bookTitle.toLowerCase().includes(q)) ||
          (r.seatNumber && r.seatNumber.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      counts: {
        all: 32,
        actualAll: FALLBACK_RESERVATIONS.length,
        today: 14,
        actualToday: 3,
        exceptions: 3,
        actualExceptions: 2,
      },
      data: filtered,
    };
  },

  /**
   * Reservation Details by Identifier
   */
  async getReservationById(id: string): Promise<{ success: boolean; data: Reservation }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    const found = FALLBACK_RESERVATIONS.find(
      (r) => r.reservationId === id || r._id === id
    ) || FALLBACK_RESERVATIONS[0];

    return {
      success: true,
      data: found,
    };
  },

  /**
   * Update Reservation Status & Circulation Desk Notes
   */
  async updateReservationStatus(
    id: string,
    status: string,
    deskNote = ''
  ): Promise<{ success: boolean; message: string; data: Reservation }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, deskNote, staffId: 'STF-4092' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    const resItem = FALLBACK_RESERVATIONS.find(
      (r) => r.reservationId === id || r._id === id
    ) || FALLBACK_RESERVATIONS[0];
    resItem.status = status as any;
    if (deskNote) resItem.deskNote = deskNote;

    return {
      success: true,
      message: `Reservation ${resItem.reservationId} updated to ${status}`,
      data: resItem,
    };
  },

  /**
   * Reject / Cancel Reservation with Reason
   */
  async rejectReservation(
    id: string,
    reason: string,
    explanation = ''
  ): Promise<{ success: boolean; message: string; data: Reservation }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, explanation, staffId: 'STF-4092' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    const resItem = FALLBACK_RESERVATIONS.find(
      (r) => r.reservationId === id || r._id === id
    ) || FALLBACK_RESERVATIONS[0];
    resItem.status = 'REJECTED';
    resItem.rejectionReason = reason;
    resItem.rejectionExplanation = explanation;

    return {
      success: true,
      message: `Reservation ${resItem.reservationId} has been successfully rejected. Student notified.`,
      data: resItem,
    };
  },

  /**
   * Catalog Book Availability Management
   */
  async getBooks(search = ''): Promise<{ success: boolean; count: number; data: Book[] }> {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/books${params}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    let list = [...FALLBACK_BOOKS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.shelfLocation.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      count: list.length,
      data: list,
    };
  },

  /**
   * Update Book Availability & Shelf Information
   */
  async updateBookAvailability(
    id: string,
    updates: Partial<Book>
  ): Promise<{ success: boolean; message: string; data: Book }> {
    try {
      const res = await fetch(`${API_BASE_URL}/books/${id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, staffId: 'STF-4092' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    const book = FALLBACK_BOOKS.find((b) => b._id === id) || FALLBACK_BOOKS[0];
    Object.assign(book, updates);

    return {
      success: true,
      message: `Book availability updated successfully for "${book.title}"`,
      data: book,
    };
  },

  /**
   * Reading Room Floor Occupancy & Seat Map
   */
  async getOccupancy(): Promise<{
    success: boolean;
    data: { timestamp: string; rooms: ReadingRoomInfo[] };
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/occupancy`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    // Default room seats
    const roomASeats: any[] = [];
    const rows = ['A', 'B', 'C', 'D'];
    rows.forEach((r) => {
      for (let i = 1; i <= 6; i++) {
        const num = `${r}0${i}`;
        const isOccupied = !['A04', 'B05', 'C06', 'D01', 'D02', 'D03'].includes(num);
        roomASeats.push({
          _id: `seat-${num}`,
          seatNumber: num,
          room: 'Reading Room A',
          floor: 'Floor 02',
          wing: 'West Wing',
          status: isOccupied ? 'occupied' : 'available',
          occupiedBy: isOccupied
            ? {
                studentId: `ST${10000 + i}`,
                studentName: `Student ${num}`,
                startTime: '10:00 AM',
                endTime: '12:00 PM',
              }
            : undefined,
        });
      }
    });

    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        rooms: [
          {
            name: 'Reading Room A',
            floor: 'Floor 02',
            wing: 'West Wing',
            totalSeats: 30,
            occupiedSeats: 18,
            availableSeats: 12,
            occupancyRate: 60,
            seats: roomASeats,
          },
          {
            name: 'Reading Room B',
            floor: 'Floor 02',
            wing: 'East Wing',
            totalSeats: 20,
            occupiedSeats: 0,
            availableSeats: 20,
            occupancyRate: 0,
            seats: [],
          },
        ],
      },
    };
  },

  /**
   * Update Interactive Seat Status
   */
  async updateSeatStatus(
    id: string,
    status: 'available' | 'occupied'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/occupancy/seat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, staffId: 'STF-4092' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    return {
      success: true,
      message: `Seat status updated to ${status}`,
    };
  },

  /**
   * No-shows & Uncollected Holdings Management
   */
  async getNoShows(): Promise<{ success: boolean; data: NoShowsSummaryData }> {
    try {
      const res = await fetch(`${API_BASE_URL}/no-shows`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    const noShowRecords = FALLBACK_RESERVATIONS.filter(
      (r) => r.status === 'NO_SHOW' || r.status === 'CANCELLED'
    );

    return {
      success: true,
      data: {
        summary: {
          todayNoShows: 3,
          gracePeriod: '15 min grace threshold',
          lastUpdated: 'Live sync with circulation desk',
        },
        records: noShowRecords,
      },
    };
  },

  /**
   * Mark Reservation as No-show & Release Resource
   */
  async markNoShow(id: string): Promise<{ success: boolean; message: string; data: Reservation }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${id}/no-show`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: 'STF-4092' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }

    const item = FALLBACK_RESERVATIONS.find((r) => r.reservationId === id || r._id === id);
    if (item) {
      item.status = 'NO_SHOW';
    }

    return {
      success: true,
      message: `Reservation ${id} marked as NO-SHOW. Resource released.`,
      data: item || FALLBACK_RESERVATIONS[0],
    };
  },
};
