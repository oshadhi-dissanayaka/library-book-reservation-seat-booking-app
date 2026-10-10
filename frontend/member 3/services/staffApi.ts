import {
  Book,
  NoShowsSummaryData,
  ReadingRoomInfo,
  Reservation,
  StaffDashboardData,
  StaffUser,
} from '../types/staff.types';

import { API_BASE } from '@/lib/api';

// Standard API Base URL with Expo / Mobile LAN support.
// Derived from the shared API config in src/lib/api.ts
// (EXPO_PUBLIC_API_URL override, else Expo dev-server host, port 5000),
// plus the backend's /api/staff mount point.
const API_BASE_URL = `${API_BASE}/staff`;

/**
 * Demo mode is EXPLICIT and opt-in.
 *
 * - Default (false): every failed read/write returns { success: false, message }
 *   and NO local object is mutated — screens surface the error.
 * - EXPO_PUBLIC_DEMO_MODE=true (frontend/.env): the hardcoded datasets below
 *   are served instead, clearly a prototype demonstration, never persistence.
 */
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

type RequestResult<T> = {
  ok: boolean;
  status: number;
  body: T | null;
  message: string;
};

/** Fetch JSON without ever throwing; failures come back as ok:false. */
async function request<T>(path: string, init?: RequestInit): Promise<RequestResult<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    const body = (await res.json().catch(() => null)) as T | null;
    if (!res.ok) {
      const message =
        (body as { message?: string } | null)?.message ||
        `Request failed (${res.status})`;
      return { ok: false, status: res.status, body, message };
    }
    return { ok: true, status: res.status, body, message: '' };
  } catch {
    return {
      ok: false,
      status: 0,
      body: null,
      message: 'Cannot reach the staff server. Check that the backend is running.',
    };
  }
}

function demoCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Login succeeds with a staff user, or fails with a message only. */
type LoginResponse =
  | { success: true; message?: string; data: StaffUser }
  | { success: false; message?: string; data?: undefined };

// ---------------------------------------------------------------------------
// Demo-mode datasets — served ONLY when EXPO_PUBLIC_DEMO_MODE=true.
// ---------------------------------------------------------------------------

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

const FALLBACK_OCCUPANCY_ROOMS: ReadingRoomInfo[] = [
  {
    name: 'Reading Room A',
    floor: 'Floor 02',
    wing: 'West Wing',
    totalSeats: 30,
    occupiedSeats: 18,
    availableSeats: 12,
    occupancyRate: 60,
    seats: [],
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
];

export const staffApi = {
  /**
   * Staff Authentication (WF-16) - always real backend validation
   * (UserAccount, role: library_staff, bcrypt). There is intentionally NO
   * demo-mode shortcut here: wrong credentials must fail.
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const result = await request<LoginResponse>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (result.ok && result.body?.success) {
      return result.body;
    }

    return {
      success: false,
      message: result.message || 'Authentication failed.',
    };
  },

  /**
   * Staff Operational Dashboard Overview (WF-17)
   */
  async getDashboard(): Promise<{
    success: boolean;
    message?: string;
    data: StaffDashboardData;
  }> {
    const result = await request<{ success: boolean; data: StaffDashboardData }>(
      '/dashboard'
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      return { success: true, data: demoCopy(FALLBACK_DASHBOARD) };
    }
    return { success: false, message: result.message, data: FALLBACK_DASHBOARD };
  },

  /**
   * Reservation Management & Filter Queue (WF-18)
   */
  async getReservations(
    filter: 'all' | 'today' | 'exceptions' = 'all',
    search = '',
    type: 'all' | 'Book' | 'Seat' = 'all'
  ): Promise<{
    success: boolean;
    message?: string;
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
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (search) params.append('search', search);
    if (type) params.append('type', type);

    const result = await request<{
      success: boolean;
      message?: string;
      counts: {
        all: number;
        actualAll: number;
        today: number;
        actualToday: number;
        exceptions: number;
        actualExceptions: number;
      };
      data: Reservation[];
    }>(`/reservations?${params.toString()}`);

    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      let filtered = demoCopy(FALLBACK_RESERVATIONS);
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
          all: FALLBACK_RESERVATIONS.length,
          actualAll: FALLBACK_RESERVATIONS.length,
          today: 3,
          actualToday: 3,
          exceptions: 2,
          actualExceptions: 2,
        },
        data: filtered,
      };
    }

    return {
      success: false,
      message: result.message,
      counts: { all: 0, actualAll: 0, today: 0, actualToday: 0, exceptions: 0, actualExceptions: 0 },
      data: [],
    };
  },

  /**
   * Reservation Details by Identifier (WF-19)
   */
  async getReservationById(id: string): Promise<{
    success: boolean;
    message?: string;
    data: Reservation;
  }> {
    const result = await request<{ success: boolean; data: Reservation }>(
      `/reservations/${encodeURIComponent(id)}`
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      const found =
        FALLBACK_RESERVATIONS.find((r) => r.reservationId === id || r._id === id) ||
        FALLBACK_RESERVATIONS[0];
      return { success: true, data: found };
    }
    return { success: false, message: result.message, data: (null as unknown) as Reservation };
  },

  /**
   * Update Reservation Status & Circulation Desk Notes (WF-19)
   */
  async updateReservationStatus(
    id: string,
    status: string,
    deskNote = ''
  ): Promise<{ success: boolean; message?: string; data: Reservation }> {
    const result = await request<{ success: boolean; message?: string; data: Reservation }>(
      `/reservations/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, deskNote }),
      }
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      const resItem =
        FALLBACK_RESERVATIONS.find((r) => r.reservationId === id || r._id === id) ||
        FALLBACK_RESERVATIONS[0];
      resItem.status = status as Reservation['status'];
      if (deskNote) resItem.deskNote = deskNote;
      return {
        success: true,
        message: `Reservation ${resItem.reservationId} updated to ${status}`,
        data: resItem,
      };
    }
    return { success: false, message: result.message, data: (null as unknown) as Reservation };
  },

  /**
   * Reject / Cancel Reservation with Reason (WF-20)
   */
  async rejectReservation(
    id: string,
    reason: string,
    explanation = ''
  ): Promise<{ success: boolean; message?: string; data: Reservation }> {
    const result = await request<{ success: boolean; message?: string; data: Reservation }>(
      `/reservations/${encodeURIComponent(id)}/reject`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, explanation }),
      }
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      const resItem =
        FALLBACK_RESERVATIONS.find((r) => r.reservationId === id || r._id === id) ||
        FALLBACK_RESERVATIONS[0];
      resItem.status = 'REJECTED';
      resItem.rejectionReason = reason;
      resItem.rejectionExplanation = explanation;
      return {
        success: true,
        message: `Reservation ${resItem.reservationId} has been successfully rejected. Student notified.`,
        data: resItem,
      };
    }
    return { success: false, message: result.message, data: (null as unknown) as Reservation };
  },

  /**
   * Catalog Book Availability Management (WF-21)
   */
  async getBooks(search = ''): Promise<{
    success: boolean;
    message?: string;
    count: number;
    data: Book[];
  }> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const result = await request<{ success: boolean; count: number; data: Book[] }>(
      `/books${params}`
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      let list = demoCopy(FALLBACK_BOOKS);
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.shelfLocation.toLowerCase().includes(q)
        );
      }
      return { success: true, count: list.length, data: list };
    }
    return { success: false, message: result.message, count: 0, data: [] };
  },

  /**
   * Update Book Availability & Shelf Information (WF-21)
   */
  async updateBookAvailability(
    id: string,
    updates: Partial<Book>
  ): Promise<{ success: boolean; message?: string; data: Book }> {
    const result = await request<{ success: boolean; message?: string; data: Book }>(
      `/books/${encodeURIComponent(id)}/availability`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      const book = FALLBACK_BOOKS.find((b) => b._id === id) || FALLBACK_BOOKS[0];
      Object.assign(book, updates);
      return {
        success: true,
        message: `Book availability updated successfully for "${book.title}"`,
        data: book,
      };
    }
    return { success: false, message: result.message, data: (null as unknown) as Book };
  },

  /**
   * Reading Room Floor Occupancy & Seat Map (WF-22)
   */
  async getOccupancy(): Promise<{
    success: boolean;
    message?: string;
    data: { timestamp: string; rooms: ReadingRoomInfo[] };
  }> {
    const result = await request<{
      success: boolean;
      data: { timestamp: string; rooms: ReadingRoomInfo[] };
    }>('/occupancy');
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          rooms: demoCopy(FALLBACK_OCCUPANCY_ROOMS),
        },
      };
    }
    return {
      success: false,
      message: result.message,
      data: { timestamp: new Date().toISOString(), rooms: [] },
    };
  },

  /**
   * Update Interactive Seat Status (WF-22)
   */
  async updateSeatStatus(
    id: string,
    status: 'available' | 'occupied'
  ): Promise<{ success: boolean; message?: string }> {
    const result = await request<{ success: boolean; message?: string }>(
      `/occupancy/seat/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      return { success: true, message: `Seat status updated to ${status}` };
    }
    return { success: false, message: result.message };
  },

  /**
   * No-shows & Uncollected Holdings Management (WF-23)
   */
  async getNoShows(): Promise<{
    success: boolean;
    message?: string;
    data: NoShowsSummaryData;
  }> {
    const result = await request<{ success: boolean; data: NoShowsSummaryData }>('/no-shows');
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      const noShowRecords = demoCopy(FALLBACK_RESERVATIONS).filter(
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
    }
    return {
      success: false,
      message: result.message,
      data: {
        summary: { todayNoShows: 0, gracePeriod: '', lastUpdated: '' },
        records: [],
      },
    };
  },

  /**
   * Mark Reservation as No-show & Release Resource (WF-23)
   */
  async markNoShow(id: string): Promise<{
    success: boolean;
    message?: string;
    data: Reservation;
  }> {
    const result = await request<{ success: boolean; message?: string; data: Reservation }>(
      `/reservations/${encodeURIComponent(id)}/no-show`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }
    );
    if (result.ok && result.body?.success) {
      return result.body;
    }

    if (DEMO_MODE) {
      const item = FALLBACK_RESERVATIONS.find(
        (r) => r.reservationId === id || r._id === id
      );
      if (item) {
        item.status = 'NO_SHOW';
      }
      return {
        success: true,
        message: `Reservation ${id} marked as NO-SHOW. Resource released.`,
        data: item || FALLBACK_RESERVATIONS[0],
      };
    }
    return { success: false, message: result.message, data: (null as unknown) as Reservation };
  },
};
