import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
 * Loads ONE persisted reservation:
 *   GET  /api/seat-reservations/:id?studentId=...  (403 if not ours)
 *   GET  /api/reading-rooms                        (building / floor / zone)
 * Cancel action:
 *   PATCH /api/seat-reservations/:id/cancel
 * Cancellation persists (status -> cancelled), keeps the record as history,
 * and frees the seat for other students because the unique index only
 * covers active reservations.
 */

// Backend address — shared API configuration (src/lib/api.ts): the Expo
// dev-server host (works on a physical phone) and the backend's port 5000.
import { API_ORIGIN as API_BASE_URL } from '@/lib/api';
import { currentStudentId, studentIdQuery } from '@/lib/student-identity';

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
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Load room display info once per mount (rooms rarely change).
  useEffect(() => {
    let active = true;

    const loadRoomInfo = async (roomId: string) => {
      try {
        const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
        if (!roomsResponse.ok) return;
        const roomsData = await roomsResponse.json();
        const rooms: RoomInfo[] = Array.isArray(roomsData.readingRooms)
          ? roomsData.readingRooms
          : [];
        const matched = rooms.find((item) => item._id === roomId) ?? null;
        if (active) setRoom(matched);
      } catch {
        // Building/floor/zone fall back to "—" below.
      }
    };

    loadRoomInfo(typeof reservation?.readingRoom === 'string' ? reservation.readingRoom : '');

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.readingRoom]);

  // Reload the real record every time the screen gains focus, so a
  // cancellation made here (or elsewhere) is always reflected.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadReservation = async () => {
        if (!id) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError('');
        setNotFound(false);
        setCancelError('');
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/seat-reservations/${encodeURIComponent(id)}?${studentIdQuery()}`
          );

          if (response.status === 404) {
            if (active) {
              setReservation(null);
              setNotFound(true);
            }
            return;
          }

          if (response.status === 403) {
            if (active) {
              setReservation(null);
              setError('This reservation belongs to another student.');
            }
            return;
          }

          if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
          }

          const data = (await response.json()) as { reservation?: Reservation };
          if (!active) return;

          if (data.reservation) {
            setReservation(data.reservation);
          } else {
            setNotFound(true);
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

      loadReservation();
      return () => {
        active = false;
      };
    }, [id])
  );

  // WF-14 cancellation — persists via PATCH /:id/cancel. The backend keeps
  // the record (history) and only flips status to "cancelled", which frees
  // the seat for other students.
  const handleCancel = async () => {
    if (!id || cancelling) return;

    setCancelling(true);
    setCancelError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/seat-reservations/${encodeURIComponent(id)}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: currentStudentId() }),
        }
      );

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        reservation?: Reservation;
      } | null;

      if (response.status === 409) {
        // Already cancelled — treat as done and refresh the record.
        if (data?.reservation) setReservation(data.reservation);
        return;
      }

      if (response.status === 403) {
        setCancelError('This reservation belongs to another student.');
        return;
      }

      if (!response.ok || !data?.reservation) {
        throw new Error(
          data?.message ?? `Server responded with status ${response.status}`
        );
      }

      // Show the persisted cancelled state straight away.
      setReservation(data.reservation);
    } catch (requestError) {
      const detail =
        requestError instanceof Error ? requestError.message : 'Unknown error';
      setCancelError(`Could not cancel this reservation. ${detail}`);
    } finally {
      setCancelling(false);
    }
  };

  // Clear back action — works for normal navigation and deep links.
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/reservations');
    }
  };

  const status = reservation?.status ?? 'active';
  const statusLabel =
    status === 'active' ? 'Active' : status === 'cancelled' ? 'Cancelled' : status;
  const statusIsCancelled = status !== 'active';
  const canCancel = Boolean(reservation) && reservation?.status === 'active' && !cancelling;

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

      {!loading && error === '' && notFound && (
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

          {/* Cancellation — only for an active reservation. */}
          {!statusIsCancelled && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Need to cancel?</Text>
              <Text style={styles.cancelHelp}>
                Cancelling frees this seat for other students. Your reservation
                is kept in your history as cancelled.
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel this reservation"
                accessibilityState={{ disabled: !canCancel }}
                disabled={!canCancel}
                style={[styles.cancelButton, !canCancel && styles.cancelButtonDisabled]}
                onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>
                  {cancelling ? 'CANCELLING…' : 'CANCEL RESERVATION'}
                </Text>
              </Pressable>

              {cancelError !== '' && (
                <Text style={styles.errorText}>{cancelError}</Text>
              )}
            </View>
          )}
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
  cancelHelp: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4A5165',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
