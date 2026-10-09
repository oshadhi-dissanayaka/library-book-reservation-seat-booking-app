import Constants from "expo-constants";

const developmentHost = Constants.expoConfig?.hostUri?.split(":")[0];
const defaultApiUrl = developmentHost
  ? `http://${developmentHost}:5000/api`
  : "http://localhost:5000/api";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl).replace(
  /\/+$/,
  ""
);

export type Book = {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  publisher?: string;
  publicationYear?: number;
  callNumber?: string;
  library: string;
  shelf?: string;
  description?: string;
  coverImage?: string;
  totalCopies: number;
  availableCopies: number;
};

export type Reservation = {
  _id: string;
  reservationId: string;
  patronId: string;
  resourceType: "book" | "seat";
  bookId: Book | null;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  holdExpiresAt: string;
  status: "confirmed" | "cancelled" | "completed" | "expired";
  createdAt: string;
};

type BookSearchResponse = {
  items: Book[];
  total: number;
  categories: string[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the library server. Check your network and API URL.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status}).`);
  }
  return payload as T;
}

export const booksApi = {
  search(search: string, category: string, availableOnly: boolean) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category && category !== "All") params.set("category", category);
    if (availableOnly) params.set("available", "true");
    const query = params.toString();
    return request<BookSearchResponse>(`/books${query ? `?${query}` : ""}`);
  },
};

export const reservationsApi = {
  list(patronId: string) {
    return request<{ items: Reservation[] }>(`/reservations?patronId=${encodeURIComponent(patronId)}`);
  },
  create(input: {
    bookId: string;
    patronId: string;
    pickupDate: string;
    pickupTime: string;
    pickupLocation: string;
    termsAccepted: boolean;
  }) {
    return request<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(id: string, input: { patronId: string; pickupDate: string; pickupTime: string }) {
    return request<Reservation>(`/reservations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  cancel(id: string, patronId: string) {
    return request<{ message: string; reservationId: string }>(
      `/reservations/${encodeURIComponent(id)}?patronId=${encodeURIComponent(patronId)}`,
      { method: "DELETE" }
    );
  },
};