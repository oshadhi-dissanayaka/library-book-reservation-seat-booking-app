import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * WF-13 - My Seat Reservations (IT3060 HCI Milestone 03)
 *
 * Lists the CURRENT student's seat reservations:
 *   GET /api/seat-reservations?studentId=...  -> this student's records
 *   GET /api/reading-rooms                    -> room name / building / floor
 */

import { API_ORIGIN as API_BASE_URL } from '@/lib/api';
import { studentIdQuery } from '@/lib/student-identity';
import { ReservationStatusBadge, M2EmptyState } from '@/components/m2';

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

function formatIsoDate(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const monthIndex = Number(parts[1]) - 1;
  if (!MONTH_NAMES[monthIndex]) return value;
  return `${Number(parts[2])} ${MONTH_NAMES[monthIndex]} ${parts[0]}`;
}

function confirmationCodeFor(id: string): string {
  return `RES-SEAT-${id.slice(-4).toUpperCase()}`;
}

export default function MyReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadData = async () => {
        setLoading(true);
        setError('');
        try {
          const reservationsResponse = await fetch(
            `${API_BASE_URL}/api/seat-reservations?${studentIdQuery()}`
          );
          if (!reservationsResponse.ok) {
            throw new Error(`Server responded with status ${reservationsResponse.status}`);
          }
          const reservationsData = await reservationsResponse.json();
          if (active) {
            setReservations(
              Array.isArray(reservationsData.reservations) ? reservationsData.reservations : []
            );
          }
          try {
            const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
            if (roomsResponse.ok) {
              const roomsData = await roomsResponse.json();
              if (active) setRooms(Array.isArray(roomsData.readingRooms) ? roomsData.readingRooms : []);
            }
          } catch {
            // Room names fall back to a generic label below.
          }
        } catch (requestError) {
          if (!active) return;
          const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
          setError(`Could not load your reservations. ${detail}. Please check that the backend server is running.`);
        } finally {
          if (active) setLoading(false);
        }
      };
      loadData();
      return () => { active = false; };
    }, [])
  );

  const activeReservations = reservations.filter((item) => item.status === 'active');
  const cancelledReservations = reservations.filter((item) => item.status !== 'active');
  const roomFor = (reservation: Reservation) => rooms.find((room) => room._id === reservation.readingRoom);

  const renderReservationCard = (reservation: Reservation) => {
    const room = roomFor(reservation);
    const isActive = reservation.status === 'active';
    return (
      <Pressable
        key={reservation._id}
        accessibilityRole="button"
        accessibilityLabel={`Reservation at ${room?.name ?? 'reading room'}, seat ${reservation.seatNumber}. Tap to view details.`}
        cssInterop={false}
        style={({ pressed }) => [styles.reservationCard, pressed && styles.reservationCardPressed]}
        onPress={() =>
          router.push({
            pathname: '/reservations/[id]',
            params: { id: reservation._id },
          })
        }>
        {/* Left color bar */}
        <View style={[styles.cardBar, isActive ? styles.cardBarActive : styles.cardBarCancelled]} />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardRoomName} numberOfLines={1}>
                {room?.name ?? 'Reading Room'}
              </Text>
              {room && (
                <Text style={styles.cardRoomMeta}>{room.building} {'\u00B7'} Floor {room.floor}</Text>
              )}
            </View>
            <ReservationStatusBadge status={reservation.status} />
          </View>

          {/* Info rows */}
          <View style={styles.cardInfoGrid}>
            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoLabel}>Seat</Text>
              <Text style={styles.cardInfoValue}>#{reservation.seatNumber}</Text>
            </View>
            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoLabel}>Date</Text>
              <Text style={styles.cardInfoValue}>{formatIsoDate(reservation.date)}</Text>
            </View>
            <View style={[styles.cardInfoItem, styles.cardTimeItem]}>
              <Text style={styles.cardInfoLabel}>Time</Text>
              <Text style={styles.cardInfoValue}>{reservation.time}</Text>
            </View>
          </View>

          {/* Ref + chevron */}
          <View style={styles.cardFooterRow}>
            <Text style={styles.cardRefCode}>{confirmationCodeFor(reservation._id)}</Text>
            <Text style={styles.cardChevron}>{'\u203A'}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.breadcrumb}>STUDY SPACES</Text>
        <Text style={styles.subheading}>Your reading-room seat bookings</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#2456B3" />
          <Text style={styles.stateText}>Loading your reservations...</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error !== '' && (
        <View style={[styles.stateCard, styles.errorCard]}>
          <Text style={styles.errorIcon}>{'\u26A0\uFE0F'}</Text>
          <Text style={styles.errorTitle}>Could not load reservations</Text>
          <Text style={styles.errorMessage}>Please check that the backend server is running and try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.replace('/reservations')}
            accessibilityRole="button"
            accessibilityLabel="Retry loading reservations">
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {/* Active reservations */}
      {!loading && error === '' && (
        <>
          {activeReservations.length === 0 ? (
            <M2EmptyState
              icon="📅"
              title="No active reservations"
              subtitle="Reserve a reading-room seat when you need a focused study space."
              actionLabel="Browse Reading Rooms"
              onAction={() => router.push('/reading-rooms')}
            />
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{activeReservations.length}</Text>
                </View>
              </View>
              {activeReservations.map(renderReservationCard)}
            </>
          )}

          {/* Cancelled / history */}
          {cancelledReservations.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: '#66738A' }]}>Past</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#EEF1F8' }]}>
                  <Text style={[styles.sectionBadgeText, { color: '#66738A' }]}>
                    {cancelledReservations.length}
                  </Text>
                </View>
              </View>
              {cancelledReservations.map(renderReservationCard)}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 48, gap: 16 },

  pageHeader: { gap: 4 },
  breadcrumb: { fontSize: 11, fontWeight: '700', color: '#2456B3', letterSpacing: 1.2, textTransform: 'uppercase' },
  subheading: { fontSize: 14, color: '#66738A' },

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
  errorMessage: { fontSize: 13, color: '#66738A', textAlign: 'center', lineHeight: 18 },
  retryButton: { marginTop: 4, backgroundColor: '#2456B3', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 24 },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#17243F' },
  sectionBadge: {
    backgroundColor: '#EAF0FC',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '800', color: '#2456B3' },

  // Reservation card
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#12203F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  reservationCardPressed: { opacity: 0.92 },
  cardBar: { width: 4, borderRadius: 2 },
  cardBarActive: { backgroundColor: '#2456B3' },
  cardBarCancelled: { backgroundColor: '#D3D8E4' },

  cardBody: { flex: 1, padding: 16, gap: 10 },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardHeaderLeft: { flex: 1, gap: 2 },
  cardRoomName: { fontSize: 16, fontWeight: '800', color: '#17243F' },
  cardRoomMeta: { fontSize: 12, color: '#66738A' },

  cardInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F4F6FB',
    borderRadius: 10,
    padding: 10,
  },
  cardInfoItem: { flex: 1, gap: 2 },
  cardTimeItem: { flexBasis: '100%', flexGrow: 0, flexShrink: 0 },
  cardInfoLabel: { fontSize: 10, fontWeight: '700', color: '#66738A', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardInfoValue: { fontSize: 13, fontWeight: '700', color: '#17243F' },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRefCode: { fontSize: 12, fontWeight: '800', color: '#2456B3', letterSpacing: 0.5 },
  cardChevron: { fontSize: 20, fontWeight: '700', color: '#66738A', lineHeight: 22 },
});
