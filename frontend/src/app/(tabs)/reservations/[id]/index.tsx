import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * WF-14 - Reservation Details (IT3060 HCI Milestone 03)
 *
 * Loads ONE persisted reservation:
 *   GET  /api/seat-reservations/:id?studentId=...  (403 if not ours)
 *   GET  /api/reading-rooms                        (building / floor / zone)
 * Cancel action:
 *   PATCH /api/seat-reservations/:id/cancel
 */

import { API_ORIGIN as API_BASE_URL } from '@/lib/api';
import { currentStudentId, studentIdQuery } from '@/lib/student-identity';
import { ReservationStatusBadge, M2InfoRow } from '@/components/m2';

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

function formatIsoDate(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const monthIndex = Number(parts[1]) - 1;
  if (!MONTH_NAMES[monthIndex]) return value;
  return `${Number(parts[2])} ${MONTH_NAMES[monthIndex]} ${parts[0]}`;
}

function formatCreated(iso: string): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return iso;
  const hours = String(created.getHours()).padStart(2, '0');
  const minutes = String(created.getMinutes()).padStart(2, '0');
  const day = created.getDate();
  const month = MONTH_NAMES[created.getMonth()];
  return `${day} ${month} ${created.getFullYear()} at ${hours}:${minutes}`;
}

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
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    let active = true;
    const loadRoomInfo = async (roomId: string) => {
      try {
        const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
        if (!roomsResponse.ok) return;
        const roomsData = await roomsResponse.json();
        const rooms: RoomInfo[] = Array.isArray(roomsData.readingRooms) ? roomsData.readingRooms : [];
        const matched = rooms.find((item) => item._id === roomId) ?? null;
        if (active) setRoom(matched);
      } catch {
        // Building/floor/zone fall back to a dash below.
      }
    };
    loadRoomInfo(typeof reservation?.readingRoom === 'string' ? reservation.readingRoom : '');
    return () => { active = false; };

  }, [reservation?.readingRoom]);

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
            if (active) { setReservation(null); setNotFound(true); }
            return;
          }
          if (response.status === 403) {
            if (active) { setReservation(null); setError('This reservation belongs to another student.'); }
            return;
          }
          if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
          const data = (await response.json()) as { reservation?: Reservation };
          if (!active) return;
          if (data.reservation) setReservation(data.reservation);
          else setNotFound(true);
        } catch (requestError) {
          if (!active) return;
          const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
          setError(`Could not load the reservation. ${detail}. Please check that the backend server is running.`);
        } finally {
          if (active) setLoading(false);
        }
      };
      loadReservation();
      return () => { active = false; };
    }, [id])
  );

  const handleCancel = async () => {
    if (!id || cancelling) return;
    setShowCancelModal(false);
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
        if (data?.reservation) setReservation(data.reservation);
        return;
      }
      if (response.status === 403) {
        setCancelError('This reservation belongs to another student.');
        return;
      }
      if (!response.ok || !data?.reservation) {
        throw new Error(data?.message ?? `Server responded with status ${response.status}`);
      }
      setReservation(data.reservation);
    } catch (requestError) {
      const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
      setCancelError(`Could not cancel this reservation. ${detail}`);
    } finally {
      setCancelling(false);
    }
  };

  const status = reservation?.status ?? 'active';
  const statusIsCancelled = status !== 'active';
  const canCancel = Boolean(reservation) && reservation?.status === 'active' && !cancelling;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Loading */}
      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#2456B3" />
          <Text style={styles.stateText}>Loading reservation...</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error !== '' && (
        <View style={[styles.stateCard, styles.errorCard]}>
          <Text style={styles.errorIcon}>{'\u26A0\uFE0F'}</Text>
          <Text style={styles.errorTitle}>Could not load</Text>
          <Text style={styles.errorBodyText}>{error}</Text>
        </View>
      )}

      {/* Not found */}
      {!loading && error === '' && notFound && (
        <View style={styles.stateCard}>
          <Text style={{ fontSize: 36 }}>{'\u1F50D'}</Text>
          <Text style={styles.notFoundTitle}>Reservation not found</Text>
          <Text style={styles.notFoundText}>This reservation does not exist or is no longer available.</Text>
        </View>
      )}

      {/* Reservation data */}
      {!loading && error === '' && reservation && (
        <>
          {/* Status banner */}
          <View style={[styles.statusBanner, statusIsCancelled && styles.statusBannerCancelled]}>
            <View style={styles.statusBannerLeft}>
              <ReservationStatusBadge status={reservation.status} />
              <Text style={styles.statusBannerRoom}>{room?.name ?? 'Reading Room'}</Text>
            </View>
            <Text style={styles.statusBannerCode}>{confirmationCodeFor(reservation._id)}</Text>
          </View>

          {/* Main info card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Booking Information</Text>

            <M2InfoRow label="Reading room" value={room?.name ?? '\u2014'} />
            <M2InfoRow label="Building" value={room?.building ?? '\u2014'} />
            <M2InfoRow label="Floor" value={room?.floor ?? '\u2014'} />
            {room?.zone ? <M2InfoRow label="Zone" value={room.zone} /> : null}
            <M2InfoRow label="Date" value={formatIsoDate(reservation.date)} />
            <M2InfoRow label="Time" value={reservation.time} />
            <M2InfoRow label="Seat number" value={`Seat ${reservation.seatNumber}`} />
            <M2InfoRow label="Reference" value={confirmationCodeFor(reservation._id)} accent />
            <M2InfoRow label="Booked on" value={formatCreated(reservation.createdAt)} />
          </View>

          {/* Cancel section - only for active reservations */}
          {!statusIsCancelled && (
            <View style={styles.card}>
              <View style={styles.cancelIntro}>
                <Text style={styles.cancelIntroTitle}>Need to cancel?</Text>
                <Text style={styles.cancelIntroText}>
                  Cancelling frees Seat {reservation.seatNumber} for other students.
                  Your reservation is kept in your history as cancelled.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel this reservation"
                accessibilityState={{ disabled: !canCancel }}
                disabled={!canCancel}
                style={[styles.cancelButton, !canCancel && styles.cancelButtonDisabled]}
                onPress={() => setShowCancelModal(true)}>
                {cancelling
                  ? <ActivityIndicator size="small" color="#B33535" />
                  : null}
                <Text style={styles.cancelButtonText}>
                  {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
                </Text>
              </Pressable>

              {cancelError !== '' && (
                <View style={styles.inlineError}>
                  <Text style={styles.inlineErrorText}>{'\u26A0\uFE0F'}  {cancelError}</Text>
                </View>
              )}
            </View>
          )}

          {/* Already-cancelled info */}
          {statusIsCancelled && (
            <View style={styles.cancelledInfo}>
              <Text style={styles.cancelledInfoText}>
                This reservation has been cancelled. The seat has been freed for other students.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Cancel confirmation modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIcon}>{'\u26A0\uFE0F'}</Text>
            </View>
            <Text style={styles.modalTitle}>Cancel this reservation?</Text>
            <Text style={styles.modalMessage}>
              Seat {reservation?.seatNumber ?? ''} at{' '}
              {room?.name ?? 'the reading room'} will become available to other students.
              This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalKeepButton}
                onPress={() => setShowCancelModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Keep this reservation">
                <Text style={styles.modalKeepText}>Keep Reservation</Text>
              </Pressable>
              <Pressable
                style={styles.modalCancelButton}
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel="Confirm cancellation">
                <Text style={styles.modalCancelText}>Cancel Reservation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 48, gap: 16 },


  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#12203F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stateText: { fontSize: 14, color: '#66738A', textAlign: 'center' },
  errorCard: { borderLeftWidth: 3, borderLeftColor: '#B33535' },
  errorIcon: { fontSize: 28 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: '#17243F' },
  errorBodyText: { fontSize: 13, color: '#66738A', textAlign: 'center', lineHeight: 18 },
  notFoundTitle: { fontSize: 17, fontWeight: '800', color: '#17243F', textAlign: 'center' },
  notFoundText: { fontSize: 14, color: '#66738A', textAlign: 'center', lineHeight: 20 },

  // Status banner
  statusBanner: {
    backgroundColor: '#EAF0FC',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  statusBannerCancelled: { backgroundColor: '#F8F0F0' },
  statusBannerLeft: { gap: 6, flex: 1 },
  statusBannerRoom: { fontSize: 18, fontWeight: '800', color: '#17243F' },
  statusBannerCode: { fontSize: 13, fontWeight: '800', color: '#2456B3', letterSpacing: 0.5 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 0,
    shadowColor: '#12203F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#17243F', marginBottom: 6 },

  // Cancel section
  cancelIntro: { gap: 6, marginBottom: 10 },
  cancelIntroTitle: { fontSize: 15, fontWeight: '800', color: '#17243F' },
  cancelIntroText: { fontSize: 13, lineHeight: 19, color: '#66738A' },

  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B33535',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
  },
  cancelButtonDisabled: { opacity: 0.5 },
  cancelButtonText: { color: '#B33535', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },

  inlineError: {
    marginTop: 8,
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 12,
  },
  inlineErrorText: { fontSize: 13, color: '#B33535', fontWeight: '600', lineHeight: 18 },

  cancelledInfo: {
    backgroundColor: '#F0F1F5',
    borderRadius: 14,
    padding: 16,
  },
  cancelledInfoText: { fontSize: 13, color: '#66738A', lineHeight: 19, textAlign: 'center' },

  // Cancel confirmation modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: { fontSize: 28 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#17243F', textAlign: 'center' },
  modalMessage: { fontSize: 14, lineHeight: 21, color: '#66738A', textAlign: 'center' },
  modalActions: { width: '100%', gap: 10, marginTop: 4 },
  modalKeepButton: {
    backgroundColor: '#2456B3',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
  },
  modalKeepText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  modalCancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B33535',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 50,
  },
  modalCancelText: { color: '#B33535', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
