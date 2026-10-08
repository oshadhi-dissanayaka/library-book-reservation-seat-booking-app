import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * WF-13 — My Reservations (IT3060 HCI Milestone 03)
 *
 * Lists the current student's ACTIVE seat reservations using the
 * existing STEP-7 API (no new endpoints, no new data sources):
 *   GET /api/reservations   -> demo-student's reservations
 *   GET /api/reading-rooms  -> room name / building / floor
 * Reservations store `readingRoom` as an id only, so the two lists
 * are joined on the client.
 *
 * Tapping a card opens WF-14 (Reservation Details): /reservations/[id]
 */

// Backend address (same convention as the WF-09/WF-10 screens).
const API_HOST = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API_BASE_URL = `http://${API_HOST}:5000`;

type Reservation = {
  _id: string;
  readingRoom: string;
  date: string;
  time: string;
  seatNumber: number;
  status: string;
  createdAt: string;
};

type RoomInfo = {
  _id: string;
  name: string;
  building: string;
  floor: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-10-16" -> "16 October 2026" (no date library needed). */
function formatIsoDate(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const monthIndex = Number(parts[1]) - 1;
  if (!MONTH_NAMES[monthIndex]) return value;
  return `${Number(parts[2])} ${MONTH_NAMES[monthIndex]} ${parts[0]}`;
}

/** Same formula the POST response used in STEP 7: RES-SEAT-XXXX. */
function confirmationCodeFor(id: string): string {
  return `RES-SEAT-${id.slice(-4).toUpperCase()}`;
}

function statusLabel(status: string): string {
  if (status === 'active') return 'Active';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

export default function MyReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. The student's reservations (existing STEP-7 endpoint).
        const reservationsResponse = await fetch(`${API_BASE_URL}/api/reservations`);
        if (!reservationsResponse.ok) {
          throw new Error(`Server responded with status ${reservationsResponse.status}`);
        }
        const reservationsData = await reservationsResponse.json();
        if (active) {
          setReservations(
            Array.isArray(reservationsData.reservations) ? reservationsData.reservations : []
          );
        }

        // 2. Room display info (existing WF-09 endpoint, best effort —
        //    the list still works if this one fails).
        try {
          const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            if (active) {
              setRooms(Array.isArray(roomsData.readingRooms) ? roomsData.readingRooms : []);
            }
          }
        } catch {
          // Room names fall back to a generic label below.
        }
      } catch (requestError) {
        if (!active) return;
        const detail =
          requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(
          `Could not load your reservations. ${detail}. Please check that the backend server is running.`
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const activeReservations = reservations.filter((item) => item.status === 'active');

  const roomFor = (reservation: Reservation) =>
    rooms.find((room) => room._id === reservation.readingRoom);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.breadcrumb}>STUDY SPACES</Text>
      <Text style={styles.heading}>My Reservations</Text>
      <Text style={styles.subheading}>Your active seat reservations</Text>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.stateText}>Loading your reservations…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === '' && activeReservations.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>No active reservations</Text>
          <Text style={styles.emptyText}>
            Seats you reserve from a reading room will appear here.
          </Text>
        </View>
      )}

      {!loading &&
        error === '' &&
        activeReservations.map((reservation) => {
          const room = roomFor(reservation);
          const cancelled = reservation.status !== 'active';
          return (
            <Pressable
              key={reservation._id}
              accessibilityRole="button"
              accessibilityLabel={`Reservation at ${
                room?.name ?? 'reading room'
              }, seat ${reservation.seatNumber}. View details.`}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/reservations/[id]',
                  params: { id: reservation._id },
                })
              }>
              <View style={styles.cardHeader}>
                <Text style={styles.roomName}>{room?.name ?? 'Reading room'}</Text>
                <View style={[styles.statusBadge, cancelled && styles.statusBadgeMuted]}>
                  <Text
                    style={[styles.statusBadgeText, cancelled && styles.statusBadgeTextMuted]}>
                    {statusLabel(reservation.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.roomMeta}>
                {room ? `${room.building} · Floor ${room.floor}` : 'Location unavailable'}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatIsoDate(reservation.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{reservation.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Seat</Text>
                <Text style={styles.detailValue}>Seat {reservation.seatNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Confirmation</Text>
                <Text style={styles.detailCode}>
                  {confirmationCodeFor(reservation._id)}
                </Text>
              </View>

              <Text style={styles.viewDetails}>View details ›</Text>
            </Pressable>
          );
        })}
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
  subheading: {
    fontSize: 15,
    color: '#4A5165',
    marginTop: -8,
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12203F',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7A8199',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#12203F',
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: '#E7F5EC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeMuted: {
    backgroundColor: '#FDECEC',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  statusBadgeTextMuted: {
    color: '#B91C1C',
  },
  roomMeta: {
    fontSize: 14,
    color: '#4A5165',
    marginTop: -6,
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
  detailCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
});
