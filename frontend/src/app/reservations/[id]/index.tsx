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
 * WF-14 — Reservation Details (IT3060 HCI Milestone 03)
 *
 * Loads the demo student's reservations from the existing STEP-7
 * endpoint and picks the one matching the route param `id`:
 *   GET /api/reservations        -> find by _id
 *   GET /api/reading-rooms       -> building / floor / zone display
 * If nothing matches, shows "Reservation not found".
 *
 * No cancellation UI: there is no cancellation API yet.
 */

// Backend address (same convention as the other screens).
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
  zone: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-10-16" -> "16 October 2026". */
function formatIsoDate(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const monthIndex = Number(parts[1]) - 1;
  if (!MONTH_NAMES[monthIndex]) return value;
  return `${Number(parts[2])} ${MONTH_NAMES[monthIndex]} ${parts[0]}`;
}

/** "2026-10-07T15:19:08.115Z" -> "7 October 2026 · 15:19" (local time). */
function formatCreated(iso: string): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return iso;
  const hours = String(created.getHours()).padStart(2, '0');
  const minutes = String(created.getMinutes()).padStart(2, '0');
  const day = created.getDate();
  const month = MONTH_NAMES[created.getMonth()];
  return `${day} ${month} ${created.getFullYear()} · ${hours}:${minutes}`;
}

/** Same formula the POST response used in STEP 7: RES-SEAT-XXXX. */
function confirmationCodeFor(id: string): string {
  return `RES-SEAT-${id.slice(-4).toUpperCase()}`;
}

export default function ReservationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      setReservation(null);
      setRoom(null);
      try {
        // 1. Reservations (existing STEP-7 endpoint) — pick ours by id.
        const reservationsResponse = await fetch(`${API_BASE_URL}/api/reservations`);
        if (!reservationsResponse.ok) {
          throw new Error(`Server responded with status ${reservationsResponse.status}`);
        }
        const reservationsData = await reservationsResponse.json();
        const list: Reservation[] = Array.isArray(reservationsData.reservations)
          ? reservationsData.reservations
          : [];
        const found = list.find((item) => item._id === id) ?? null;
        if (active) setReservation(found);

        // 2. Room display info (existing WF-09 endpoint, best effort).
        try {
          const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            const rooms: RoomInfo[] = Array.isArray(roomsData.readingRooms)
              ? roomsData.readingRooms
              : [];
            const matched = found
              ? rooms.find((item) => item._id === found.readingRoom) ?? null
              : null;
            if (active) setRoom(matched);
          }
        } catch {
          // Building/floor/zone fall back to "—" below.
        }
      } catch (requestError) {
        if (!active) return;
        const detail =
          requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(
          `Could not load the reservation. ${detail}. Please check that the backend server is running.`
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  // Clear back action — works for normal navigation and deep links.
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/reservations' as any);
    }
  };

  const status = reservation?.status ?? 'active';
  const statusLabel =
    status === 'active' ? 'Active' : status === 'cancelled' ? 'Cancelled' : status;
  const statusIsCancelled = status !== 'active';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header with back action */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backRow}
        onPress={handleBack}>
        <Text style={styles.backText}>‹ Back</Text>
        <Text style={styles.headerTitle}>Reservation Details</Text>
      </Pressable>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.stateText}>Loading reservation…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === '' && !reservation && (
        <View style={styles.card}>
          <Text style={styles.notFoundTitle}>Reservation not found</Text>
          <Text style={styles.notFoundText}>
            This reservation does not exist or is no longer available.
          </Text>
        </View>
      )}

      {!loading && error === '' && reservation && (
        <>
          {/* Status + confirmation code */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.statusBadge,
                  statusIsCancelled && styles.statusBadgeMuted,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    statusIsCancelled && styles.statusBadgeTextMuted,
                  ]}>
                  {statusLabel.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.referenceCode}>
                {confirmationCodeFor(reservation._id)}
              </Text>
            </View>
            <Text style={styles.roomTitle}>{room?.name ?? 'Reading room'}</Text>
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reservation details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{statusLabel}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confirmation code</Text>
              <Text style={styles.detailCode}>
                {confirmationCodeFor(reservation._id)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reading room</Text>
              <Text style={styles.detailValue}>{room?.name ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Building</Text>
              <Text style={styles.detailValue}>{room?.building ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Floor</Text>
              <Text style={styles.detailValue}>{room?.floor ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zone</Text>
              <Text style={styles.detailValue}>{room?.zone ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {formatIsoDate(reservation.date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{reservation.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seat number</Text>
              <Text style={styles.detailValue}>Seat {reservation.seatNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {formatCreated(reservation.createdAt)}
              </Text>
            </View>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    lineHeight: 26,
  },
  headerTitle: {
    fontSize: 20,
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
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12203F',
    textAlign: 'center',
  },
  notFoundText: {
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
  referenceCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#12203F',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12203F',
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
    textAlign: 'right',
    maxWidth: '60%',
  },
  detailCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
});
