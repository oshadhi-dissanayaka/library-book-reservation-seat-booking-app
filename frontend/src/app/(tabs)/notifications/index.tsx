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
 * WF-15 - Notifications (IT3060 HCI Milestone 03)
 *
 * LOCAL / IN-APP ONLY.
 * There is NO notification backend, no scheduled jobs and no push
 * notification service in this project. This screen builds a simple
 * notification list ON THE DEVICE from the CURRENT student's persisted
 * reservation data:
 *   GET /api/seat-reservations?studentId=...  -> this student's records
 *   GET /api/reading-rooms                    -> room names for the messages
 *
 * Events generated locally:
 *   - "Seat reservation confirmed"  (one per active reservation)
 *   - "Reservation reminder"        (UI representation only)
 *   - "Reservation cancelled"       (one per cancelled reservation)
 *
 * Tapping a reservation-related item opens WF-14 (/reservations/[id]).
 */

import { API_ORIGIN as API_BASE_URL } from '@/lib/api';
import { studentIdQuery } from '@/lib/student-identity';
import { M2EmptyState } from '@/components/m2';

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
};

type NotificationItem = {
  key: string;
  kind: 'confirmed' | 'reminder' | 'cancelled';
  title: string;
  message: string;
  detail: string;
  when: string;
  reservationId?: string;
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

const KIND_CONFIG = {
  confirmed: {
    icon: '\u2705',
    accentColor: '#16875B',
    badgeBg: '#E8F6EF',
    badgeText: '#16875B',
    barColor: '#16875B',
    label: 'Confirmed',
  },
  reminder: {
    icon: '\u23F3',
    accentColor: '#2456B3',
    badgeBg: '#EAF0FC',
    badgeText: '#2456B3',
    barColor: '#2456B3',
    label: 'Reminder',
  },
  cancelled: {
    icon: '\u274C',
    accentColor: '#B33535',
    badgeBg: '#FDECEC',
    badgeText: '#B33535',
    barColor: '#B33535',
    label: 'Cancelled',
  },
} as const;

export default function NotificationsScreen() {
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
            // Messages fall back to a generic room label below.
          }
        } catch (requestError) {
          if (!active) return;
          const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
          setError(`Could not load notifications. ${detail}. Please check that the backend server is running.`);
        } finally {
          if (active) setLoading(false);
        }
      };
      loadData();
      return () => { active = false; };
    }, [])
  );

  // Build the local notification list from this student's reservations.
  const items: NotificationItem[] = [];
  reservations.forEach((reservation) => {
    const room = rooms.find((item) => item._id === reservation.readingRoom);
    const roomName = room?.name ?? 'reading room';
    const seatLabel = `Seat ${reservation.seatNumber}`;
    const when = formatIsoDate(reservation.date);

    if (reservation.status !== 'active') {
      items.push({
        key: `${reservation._id}-cancelled`,
        kind: 'cancelled',
        title: 'Reservation cancelled',
        message: `Your reservation for ${seatLabel} at ${roomName} was cancelled.`,
        detail: `${confirmationCodeFor(reservation._id)} \u00B7 ${reservation.time}`,
        when,
        reservationId: reservation._id,
      });
      return;
    }

    items.push({
      key: `${reservation._id}-confirmed`,
      kind: 'confirmed',
      title: 'Seat reservation confirmed',
      message: `${roomName} \u00B7 ${seatLabel} is reserved for you.`,
      detail: `${confirmationCodeFor(reservation._id)} \u00B7 ${reservation.time}`,
      when,
      reservationId: reservation._id,
    });

    items.push({
      key: `${reservation._id}-reminder`,
      kind: 'reminder',
      title: 'Reservation reminder',
      message: `Please arrive 15 minutes early at ${roomName} and carry your Student ID.`,
      detail: `${seatLabel} \u00B7 ${reservation.time}`,
      when,
      reservationId: reservation._id,
    });
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.breadcrumb}>STUDY SPACES</Text>
        <Text style={styles.subheading}>In-app notifications from your seat reservations</Text>
      </View>

      {/* In-app only disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerIcon}>{'\u2139\uFE0F'}</Text>
        <View style={styles.disclaimerContent}>
          <Text style={styles.disclaimerTitle}>In-app notifications only</Text>
          <Text style={styles.disclaimerText}>
            These items are generated from your reservation data when you open this screen.
            No push notifications are sent.
          </Text>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#2456B3" />
          <Text style={styles.stateText}>Loading notifications...</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error !== '' && (
        <View style={[styles.stateCard, styles.errorCard]}>
          <Text style={styles.errorIcon}>{'\u26A0\uFE0F'}</Text>
          <Text style={styles.errorTitle}>Could not load notifications</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && error === '' && items.length === 0 && (
        <M2EmptyState
          icon="\uD83D\uDCEB"
          title="No notifications yet"
          subtitle="Notifications appear here once you reserve a reading-room seat."
          actionLabel="Browse Reading Rooms"
          onAction={() => router.push('/reading-rooms')}
        />
      )}

      {/* Notification list */}
      {!loading && error === '' && items.map((item) => {
        const cfg = KIND_CONFIG[item.kind];
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.message}. Open reservation details.`}
            cssInterop={false}
            style={({ pressed }) => [styles.notifCard, pressed && styles.notifCardPressed]}
            onPress={() => {
              if (item.reservationId) {
                router.push({
                  pathname: '/reservations/[id]',
                  params: { id: item.reservationId },
                });
              }
            }}>
            {/* Left accent bar */}
            <View style={[styles.notifBar, { backgroundColor: cfg.barColor }]} />

            <View style={styles.notifBody}>
              {/* Header */}
              <View style={styles.notifHeader}>
                <Text style={styles.notifHeaderIcon}>{cfg.icon}</Text>
                <View style={styles.notifHeaderCenter}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifWhen}>{item.when}</Text>
                </View>
                <View style={[styles.kindBadge, { backgroundColor: cfg.badgeBg }]}>
                  <Text style={[styles.kindBadgeText, { color: cfg.badgeText }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>

              {/* Message */}
              <Text style={styles.notifMessage}>{item.message}</Text>

              {/* Detail + open link */}
              <View style={styles.notifFooter}>
                <Text style={styles.notifDetail}>{item.detail}</Text>
                {item.reservationId && (
                  <Text style={styles.notifOpenLink}>View details {'\u203A'}</Text>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 48, gap: 14 },

  pageHeader: { gap: 4 },
  breadcrumb: { fontSize: 11, fontWeight: '700', color: '#2456B3', letterSpacing: 1.2, textTransform: 'uppercase' },
  subheading: { fontSize: 14, color: '#66738A' },

  disclaimerCard: {
    backgroundColor: '#EAF0FC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  disclaimerIcon: { fontSize: 20, marginTop: 1 },
  disclaimerContent: { flex: 1, gap: 4 },
  disclaimerTitle: { fontSize: 13, fontWeight: '800', color: '#17243F' },
  disclaimerText: { fontSize: 12, lineHeight: 17, color: '#3A425A' },

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
  errorText: { fontSize: 13, color: '#66738A', textAlign: 'center', lineHeight: 18 },

  // Notification card
  notifCard: {
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
  notifCardPressed: { opacity: 0.92 },
  notifBar: { width: 4 },

  notifBody: { flex: 1, padding: 14, gap: 8 },

  notifHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  notifHeaderIcon: { fontSize: 20, lineHeight: 24 },
  notifHeaderCenter: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 14, fontWeight: '800', color: '#17243F', flexShrink: 1 },
  notifWhen: { fontSize: 11, color: '#66738A', fontWeight: '600' },

  kindBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  kindBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  notifMessage: { fontSize: 13, lineHeight: 19, color: '#4A5165' },

  notifFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  notifDetail: { fontSize: 12, fontWeight: '600', color: '#66738A', flex: 1 },
  notifOpenLink: { fontSize: 12, fontWeight: '700', color: '#2456B3' },
});
