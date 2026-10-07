import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * WF-12 — Reservation Confirmation (IT3060 HCI Milestone 03)
 *
 * Reached from the WF-10 seat grid after POST /api/reservations
 * succeeds. All details arrive as route params (no extra endpoint):
 *   id, confirmationCode, roomName, building, floor, date, time,
 *   seatNumber, status
 *
 * Shares the WF-09/WF-10 visual language: off-white background,
 * white rounded cards, dark blue primary action.
 */

export default function ReservationConfirmationScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    confirmationCode?: string;
    roomName?: string;
    building?: string;
    floor?: string;
    date?: string;
    time?: string;
    seatNumber?: string;
    status?: string;
  }>();

  const id = params.id ?? '';
  const status = params.status ?? 'active';

  const statusLabel =
    status === 'active' ? 'Active' : status === 'cancelled' ? 'Cancelled' : status;

  // Prefer the code sent by the API; fall back to deriving it from the id.
  const referenceCode =
    params.confirmationCode ||
    (id ? `RES-SEAT-${id.slice(-4).toUpperCase()}` : 'N/A');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.breadcrumb}>STUDY SPACES</Text>

      {/* Success hero */}
      <View style={styles.heroCard}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={styles.statusDot} />
          <Text style={styles.statusChipText}>SEAT RESERVED</Text>
        </View>
        <Text style={styles.heading}>Reservation Confirmed</Text>
        <Text style={styles.subtitle}>
          Your seat at {params.roomName || 'the reading room'} has been reserved
          successfully.
        </Text>
      </View>

      {/* Reservation details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reservation details</Text>

        <View style={styles.referenceRow}>
          <Text style={styles.referenceLabel}>Reference ID</Text>
          <Text style={styles.referenceValue}>{referenceCode}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reading room</Text>
          <Text style={styles.detailValue}>{params.roomName || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Building / Floor</Text>
          <Text style={styles.detailValue}>
            {params.building || '—'}
            {params.floor ? ` / ${params.floor}` : ''}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{params.date || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{params.time || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Seat number</Text>
          <Text style={styles.detailValue}>{params.seatNumber || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{statusLabel}</Text>
        </View>
      </View>

      {/* Guidelines */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Before you go</Text>
        <Text style={styles.infoText}>
          Please arrive within 15 minutes of your scheduled time and carry your
          Student ID. Seats not claimed within 15 minutes may be released to other
          students.
        </Text>
      </View>

      {/* Primary action */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to reading rooms"
        style={styles.primaryButton}
        onPress={() => router.replace('/reading-rooms')}>
        <Text style={styles.primaryButtonText}>BACK TO READING ROOMS</Text>
      </Pressable>

      {/* Small local links to WF-13 (My Reservations) and WF-15 (Notifications) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View my reservations"
        style={styles.secondaryButton}
        onPress={() => router.push('/reservations')}>
        <Text style={styles.secondaryButtonText}>VIEW MY RESERVATIONS</Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="View notifications"
        style={styles.linkButton}
        onPress={() => router.push('/notifications')}>
        <Text style={styles.linkText}>View notifications →</Text>
      </Pressable>
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#12203F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E7F5EC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803D',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#12203F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A5165',
    textAlign: 'center',
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12203F',
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF1F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  referenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A8199',
  },
  referenceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
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
  primaryButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1E3A8A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
