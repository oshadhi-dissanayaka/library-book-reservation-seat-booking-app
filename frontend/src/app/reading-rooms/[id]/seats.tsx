import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * WF-10 + WF-11 — Seat Availability & Seat Reservation (IT3060 HCI Milestone 03)
 *
 * Data sources (all real, no placeholder occupancy):
 * - Room info:        GET /api/reading-rooms   (matched by route param `id`)
 * - Occupied seats:   GET /api/reservations?readingRoom&date&time
 * - Reserve a seat:   POST /api/reservations   (WF-11)
 * - On success:       navigate to /reservations/[id]/confirmation (WF-12)
 *
 * WF-09 sends `date` as a friendly label ("7 October 2026") for display;
 * the API stores dates as "YYYY-MM-DD", converted by toIsoDate() below.
 */

// Backend address (same convention as the WF-09 screen): the host the
// device used to reach Metro, port 5000 = backend default (server.js).
const API_HOST = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API_BASE_URL = `http://${API_HOST}:5000`;

type ReadingRoom = {
  _id: string;
  name: string;
  building: string;
  floor: string;
  zone: string;
  totalSeats: number;
};

type ReservationSummary = {
  _id: string;
  readingRoom: string;
  date: string;
  time: string;
  seatNumber: number;
  status: string;
};

// Response of POST /api/reservations (only the fields this screen needs).
type CreatedReservation = {
  _id?: string;
  message?: string;
  seatNumber?: number;
  status?: string;
  confirmationCode?: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "7 October 2026" -> "2026-10-07" (or null if the label is missing). */
function toIsoDate(label: string): string | null {
  const parts = label.split(' '); // ["7", "October", "2026"]
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const monthIndex = MONTH_NAMES.indexOf(parts[1]);
  const year = Number(parts[2]);
  if (!day || monthIndex < 0 || !year) return null;
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function SeatAvailabilityScreen() {
  const { id, date, time } = useLocalSearchParams<{
    id?: string;
    date?: string;
    time?: string;
  }>();

  const [room, setRoom] = useState<ReadingRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // WF-11 states
  const [reservedSeats, setReservedSeats] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [reserveError, setReserveError] = useState('');

  // Friendly label from WF-09 -> "YYYY-MM-DD" for the API.
  const isoDate = date ? toIsoDate(date) : null;

  // Load the room (existing WF-09 endpoint) plus the seats already
  // reserved for this room + date + time (reservation API).
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Reading room info
        const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
        if (!roomsResponse.ok) {
          throw new Error(`Server responded with status ${roomsResponse.status}`);
        }
        const roomsData = await roomsResponse.json();
        const rooms: ReadingRoom[] = Array.isArray(roomsData.readingRooms)
          ? roomsData.readingRooms
          : [];
        const found = rooms.find((roomItem) => roomItem._id === id);

        if (!found) {
          if (active) setError('Reading room not found.');
          return;
        }
        if (active) {
          setRoom(found);
          setReservedSeats([]);
        }

        // 2. Seats already reserved for this exact slot (WF-10/11 query)
        if (id && isoDate && time) {
          const reservationsUrl =
            `${API_BASE_URL}/api/reservations?readingRoom=${encodeURIComponent(id)}` +
            `&date=${isoDate}&time=${encodeURIComponent(time)}`;
          const reservationsResponse = await fetch(reservationsUrl);
          if (!reservationsResponse.ok) {
            throw new Error(`Server responded with status ${reservationsResponse.status}`);
          }
          const reservationsData = await reservationsResponse.json();
          const reservations: ReservationSummary[] = Array.isArray(
            reservationsData.reservations
          )
            ? reservationsData.reservations
            : [];
          const taken = reservations
            .filter((item) => item.status === 'active')
            .map((item) => item.seatNumber);
          if (active) setReservedSeats(taken);
        }
      } catch (requestError) {
        if (!active) return;
        const detail =
          requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(
          `Could not load this reading room. ${detail}. Please check that the backend server is running.`
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [id, isoDate, time]);

  // Seats actually inside this room's grid (defensive filter).
  const occupiedSeats = room
    ? reservedSeats.filter((seat) => seat >= 1 && seat <= room.totalSeats)
    : [];
  const availableCount = room ? room.totalSeats - occupiedSeats.length : 0;

  const isOccupied = (seat: number) => occupiedSeats.includes(seat);

  // Tap an available seat to select it; tap it again to deselect.
  const toggleSeat = (seat: number) => {
    if (isOccupied(seat)) return;
    setReserveError('');
    setSelectedSeat((current) => (current === seat ? null : seat));
  };

  // WF-11 — POST the reservation, then go to the WF-12 confirmation screen.
  const handleReserve = async () => {
    if (selectedSeat === null || !room || !date || !isoDate || !time || saving) {
      return;
    }
    setSaving(true);
    setReserveError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingRoom: room._id,
          date: isoDate,
          time,
          seatNumber: selectedSeat,
        }),
      });

      let data: CreatedReservation | null = null;
      try {
        data = (await response.json()) as CreatedReservation;
      } catch {
        data = null;
      }

      // Seat was taken between loading the grid and pressing Reserve.
      if (response.status === 409) {
        setReserveError(
          'This seat is no longer available. Please select another seat.'
        );
        setReservedSeats((current) =>
          current.includes(selectedSeat) ? current : [...current, selectedSeat]
        );
        setSelectedSeat(null);
        return;
      }

      if (!response.ok || !data || !data._id) {
        throw new Error(
          data?.message ?? `Server responded with status ${response.status}`
        );
      }

      // WF-12 — never silently go back: show the confirmation screen.
      router.push({
        pathname: '/reservations/[id]/confirmation',
        params: {
          id: data._id,
          confirmationCode: data.confirmationCode ?? '',
          roomName: room.name,
          building: room.building,
          floor: room.floor,
          date,
          time,
          seatNumber: String(selectedSeat),
          status: data.status ?? 'active',
        },
      });
    } catch (requestError) {
      const detail =
        requestError instanceof Error ? requestError.message : 'Unknown error';
      setReserveError(`Could not save your reservation. ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.breadcrumb}>STUDY SPACES</Text>
      <Text style={styles.heading}>Seat Availability</Text>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.stateText}>Loading seat availability…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === '' && room && (
        <>
          {/* Reading room info */}
          <View style={styles.card}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomMeta}>
              {room.building} · Floor {room.floor}
            </Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{room.zone}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selected date</Text>
              <Text style={styles.detailValue}>{date || 'Not selected'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selected time</Text>
              <Text style={styles.detailValue}>{time || 'Not selected'}</Text>
            </View>
          </View>

          {/* Seat summary */}
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total seats</Text>
              <Text style={styles.detailValue}>{room.totalSeats}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Available seats</Text>
              <Text style={styles.detailValue}>{availableCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Occupied / reserved</Text>
              <Text style={styles.detailValue}>{occupiedSeats.length}</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotAvailable]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotOccupied]} />
                <Text style={styles.legendText}>Occupied</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotSelected]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
            </View>
          </View>

          {/* Seat grid */}
          <View style={styles.card}>
            <Text style={styles.gridTitle}>Select a seat</Text>
            <View style={styles.grid}>
              {Array.from({ length: room.totalSeats }, (_, index) => index + 1).map(
                (seat) => {
                  const occupied = isOccupied(seat);
                  const selected = selectedSeat === seat;
                  return (
                    <Pressable
                      key={seat}
                      disabled={occupied}
                      accessibilityRole="button"
                      accessibilityLabel={`Seat ${seat}, ${
                        occupied ? 'unavailable' : selected ? 'selected' : 'available'
                      }`}
                      accessibilityState={{ disabled: occupied, selected }}
                      style={[
                        styles.seat,
                        occupied && styles.seatOccupied,
                        selected && styles.seatSelected,
                      ]}
                      onPress={() => toggleSeat(seat)}>
                      <Text
                        style={[
                          styles.seatText,
                          occupied && styles.seatTextOccupied,
                          selected && styles.seatTextSelected,
                        ]}>
                        {seat}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Text style={styles.selectedInfo}>
              {selectedSeat !== null
                ? `Selected: Seat ${selectedSeat}`
                : 'Tap an available seat to select it'}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reserve the selected seat"
              disabled={selectedSeat === null || saving}
              style={[
                styles.primaryButton,
                (selectedSeat === null || saving) && styles.primaryButtonDisabled,
              ]}
              onPress={handleReserve}>
              <Text style={styles.primaryButtonText}>
                {saving ? 'SAVING…' : 'RESERVE SEAT →'}
              </Text>
            </Pressable>

            {saving && (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color="#1E3A8A" />
                <Text style={styles.savingText}>Saving your reservation…</Text>
              </View>
            )}

            {!saving && reserveError !== '' && (
              <Text style={styles.errorText}>{reserveError}</Text>
            )}
          </View>

          {/* Guidelines */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Reading Room Guidelines</Text>
            <Text style={styles.infoText}>
              Seats are held for 15 minutes after the booking start time. Please keep
              noise to a minimum and carry your Student ID. Occupied seats shown here
              come from the live reservation list for your selected date and time.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  breadcrumb: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#12203F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    shadowColor: '#12203F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5165',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#B91C1C',
    textAlign: 'center',
  },
  roomName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#12203F',
  },
  roomMeta: {
    fontSize: 14,
    color: '#4A5165',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  tag: {
    backgroundColor: '#EEF1F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E6EF',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7A8199',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#12203F',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotAvailable: {
    backgroundColor: '#EEF1F8',
    borderWidth: 1.5,
    borderColor: '#C9D2E8',
  },
  legendDotOccupied: {
    backgroundColor: '#D3D8E4',
  },
  legendDotSelected: {
    backgroundColor: '#1E3A8A',
  },
  legendText: {
    fontSize: 13,
    color: '#4A5165',
  },
  gridTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12203F',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  seat: {
    width: 48,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1F8',
    borderWidth: 1.5,
    borderColor: '#C9D2E8',
  },
  seatOccupied: {
    backgroundColor: '#E3E6EF',
    borderColor: '#D3D8E4',
  },
  seatSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  seatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#12203F',
  },
  seatTextOccupied: {
    color: '#98A0B3',
    textDecorationLine: 'line-through',
  },
  seatTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedInfo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5165',
  },
  infoCard: {
    backgroundColor: '#E9EDF9',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12203F',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A425A',
  },
});
