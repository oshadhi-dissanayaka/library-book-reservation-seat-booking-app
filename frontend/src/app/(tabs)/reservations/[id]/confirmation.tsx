import { useEffect, useState } from 'react';
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
 * WF-12 - Reservation Confirmation (IT3060 HCI Milestone 03)
 *
 * Reached from the WF-10 seat grid after POST /api/seat-reservations
 * succeeds. The screen shows what was ACTUALLY persisted:
 *   GET /api/seat-reservations/:id  (real record + confirmation code)
 * Route params remain as a fallback if that request fails.
 */

import { API_ORIGIN as API_BASE_URL } from '@/lib/api';
import { studentIdQuery } from '@/lib/student-identity';
import { M2InfoRow } from '@/components/m2';

type PersistedReservation = {
  _id?: string;
  date?: string;
  time?: string;
  seatNumber?: number;
  status?: string;
  readingRoom?: string | { name?: string; building?: string; floor?: string };
};

export default function ReservationConfirmationScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    confirmationCode?: string;
    roomName?: string;
    building?: string;
    floor?: string;
    date?: string;
    time?: string;
    blockCount?: string;
    seatNumber?: string;
    status?: string;
  }>();

  const id = params.id ?? '';

  const [persisted, setPersisted] = useState<PersistedReservation | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(id !== '');
  const [recordFailed, setRecordFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (id === '') return () => { active = false; };
    const loadRecord = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/seat-reservations/${encodeURIComponent(id)}?${studentIdQuery()}`
        );
        if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
        const data = (await response.json()) as {
          reservation?: PersistedReservation;
          confirmationCode?: string;
        };
        if (active && data.reservation) setPersisted(data.reservation);
      } catch {
        if (active) setRecordFailed(true);
      } finally {
        if (active) setLoadingRecord(false);
      }
    };
    loadRecord();
    return () => { active = false; };
  }, [id]);

  const room = typeof persisted?.readingRoom === 'object' ? persisted.readingRoom : null;
  const status = persisted?.status ?? params.status ?? 'active';
  const blockCount = Math.max(1, Number(params.blockCount) || 1);
  const referenceCode = recordFailed
    ? params.confirmationCode || (id ? `RES-SEAT-${id.slice(-4).toUpperCase()}` : 'N/A')
    : persisted
      ? `RES-SEAT-${String(persisted._id ?? id).slice(-4).toUpperCase()}`
      : params.confirmationCode || (id ? `RES-SEAT-${id.slice(-4).toUpperCase()}` : 'N/A');

  const displayDate = persisted?.date ?? params.date;
  const displayTime = persisted?.time ?? params.time;
  const displaySeat = persisted?.seatNumber ?? params.seatNumber;
  const displayRoomName = room?.name ?? params.roomName;
  const displayBuilding = room?.building ?? params.building;
  const displayFloor = room?.floor ?? params.floor;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* --- Success Hero --- */}
      <View style={styles.heroCard}>
        <View style={styles.checkCircleOuter}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>{'\u2713'}</Text>
          </View>
        </View>
        <View style={styles.statusChip}>
          <View style={styles.statusDot} />
          <Text style={styles.statusChipText}>SEAT RESERVED</Text>
        </View>
        <Text style={styles.heroTitle}>Reservation Confirmed</Text>
        <Text style={styles.heroSubtitle}>
          Your seat at{' '}
          <Text style={{ fontWeight: '800', color: '#17243F' }}>
            {displayRoomName || 'the reading room'}
          </Text>{' '}
          has been reserved successfully.
        </Text>

        {/* Reference code prominent */}
        <View style={styles.referenceBox}>
          <Text style={styles.referenceBoxLabel}>Booking Reference</Text>
          <Text style={styles.referenceBoxCode}>{referenceCode}</Text>
        </View>

        {loadingRecord && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color="#2456B3" />
            <Text style={styles.verifyingText}>Verifying your reservation...</Text>
          </View>
        )}
      </View>

      {/* --- Reservation Details Card --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reservation Details</Text>

        <M2InfoRow label="Reading room" value={displayRoomName || '\u2014'} />
        {(displayBuilding || displayFloor) && (
          <M2InfoRow
            label="Building / Floor"
            value={[displayBuilding, displayFloor ? `Floor ${displayFloor}` : ''].filter(Boolean).join(' \u00B7 ')}
          />
        )}
        <M2InfoRow label="Date" value={displayDate || '\u2014'} />
        <M2InfoRow label="Time" value={displayTime || '\u2014'} />
        {blockCount > 1 && (
          <M2InfoRow label="Duration" value={`${blockCount} x 2-hour blocks (${blockCount * 2} hrs)`} />
        )}
        <M2InfoRow label="Seat number" value={displaySeat ? `Seat ${displaySeat}` : '\u2014'} />
        <M2InfoRow
          label="Status"
          value={status === 'active' ? 'Active' : status === 'cancelled' ? 'Cancelled' : String(status)}
        />
      </View>

      {/* --- Before you go --- */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardIcon}>{'\u2139\uFE0F'}</Text>
        <View style={styles.infoCardContent}>
          <Text style={styles.infoCardTitle}>Before you go</Text>
          <Text style={styles.infoCardText}>
            Please arrive within 15 minutes of your scheduled start time and carry your Student ID.
            Seats not claimed within 15 minutes may be released to other students.
          </Text>
        </View>
      </View>

      {/* --- Actions --- */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View my seat reservations"
        cssInterop={false}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        onPress={() => router.push('/reservations')}>
        <Text style={styles.primaryButtonText}>View My Reservations</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },
  content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48, gap: 16 },

  // Hero card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#12203F',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  checkCircleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EAF0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2456B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', lineHeight: 38 },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F6EF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16875B' },
  statusChipText: { fontSize: 11, fontWeight: '800', color: '#16875B', letterSpacing: 1 },

  heroTitle: { fontSize: 24, fontWeight: '800', color: '#17243F', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, lineHeight: 21, color: '#66738A', textAlign: 'center' },

  referenceBox: {
    backgroundColor: '#EAF0FC',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  referenceBoxLabel: { fontSize: 11, fontWeight: '700', color: '#66738A', textTransform: 'uppercase', letterSpacing: 0.8 },
  referenceBoxCode: { fontSize: 20, fontWeight: '800', color: '#2456B3', letterSpacing: 1.5 },

  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifyingText: { fontSize: 13, color: '#66738A', fontWeight: '600' },

  // Details card
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
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#17243F', marginBottom: 4 },

  // Info card
  infoCard: {
    backgroundColor: '#E9EDF9',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoCardIcon: { fontSize: 22, marginTop: 2 },
  infoCardContent: { flex: 1, gap: 6 },
  infoCardTitle: { fontSize: 14, fontWeight: '800', color: '#17243F' },
  infoCardText: { fontSize: 13, lineHeight: 19, color: '#3A425A' },

  // Buttons
  primaryButton: {
    backgroundColor: '#2456B3',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonPressed: { opacity: 0.88 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

});
