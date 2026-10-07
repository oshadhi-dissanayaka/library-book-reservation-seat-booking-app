import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * WF-15 — Notifications (IT3060 HCI Milestone 03)
 *
 * LOCAL / IN-APP ONLY.
 * There is NO notification backend, no scheduled jobs and no push
 * notification service in this project. This screen builds a simple
 * notification list ON THE DEVICE from the existing reservation data:
 *   GET /api/reservations   -> demo-student's reservations
 *   GET /api/reading-rooms  -> room names for the messages
 *
 * Events generated locally:
 *   - "Seat reservation confirmed"  (one per active reservation)
 *   - "Reservation reminder"        (UI representation only — it is
 *     NOT a scheduled or delivered push notification)
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
};

type NotificationItem = {
  key: string;
  kind: 'confirmed' | 'reminder';
  title: string;
  message: string;
  detail: string;
  when: string;
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

/** Same formula the POST response used in STEP 7: RES-SEAT-XXXX. */
function confirmationCodeFor(id: string): string {
  return `RES-SEAT-${id.slice(-4).toUpperCase()}`;
}

export default function NotificationsScreen() {
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

        // Room names are display-only — best effort.
        try {
          const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            if (active) {
              setRooms(Array.isArray(roomsData.readingRooms) ? roomsData.readingRooms : []);
            }
          }
        } catch {
          // Messages fall back to a generic room label below.
        }
      } catch (requestError) {
        if (!active) return;
        const detail =
          requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(
          `Could not load notifications. ${detail}. Please check that the backend server is running.`
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

  // Build the local notification list from the active reservations.
  const items: NotificationItem[] = [];
  reservations
    .filter((reservation) => reservation.status === 'active')
    .forEach((reservation) => {
      const room = rooms.find((item) => item._id === reservation.readingRoom);
      const roomName = room?.name ?? 'reading room';
      const seatLabel = `Seat ${reservation.seatNumber}`;
      const when = formatIsoDate(reservation.date);

      items.push({
        key: `${reservation._id}-confirmed`,
        kind: 'confirmed',
        title: 'Seat reservation confirmed',
        message: `${roomName} — ${seatLabel} is reserved for you.`,
        detail: `${confirmationCodeFor(reservation._id)} · ${reservation.time}`,
        when,
      });

      items.push({
        key: `${reservation._id}-reminder`,
        kind: 'reminder',
        title: 'Reservation reminder',
        message: `Please arrive 15 minutes before your session at ${roomName} and carry your Student ID.`,
        detail: `${seatLabel} · ${reservation.time}`,
        when,
      });
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.breadcrumb}>STUDY SPACES</Text>
      <Text style={styles.heading}>Notifications</Text>
      <Text style={styles.subheading}>
        Local, in-app notifications generated on this device
      </Text>

      {/* Clear separation: this is UI-only, not a push service. */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>In-app notifications only</Text>
        <Text style={styles.infoText}>
          These items are built from your reservation data when you open this
          screen. This milestone does not schedule or send push notifications —
          the reminder below is a UI representation only.
        </Text>
      </View>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.stateText}>Loading notifications…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === '' && items.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            Notifications appear here once you reserve a seat.
          </Text>
        </View>
      )}

      {!loading &&
        error === '' &&
        items.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.kindDot,
                  item.kind === 'reminder' && styles.kindDotReminder,
                ]}
              />
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemWhen}>{item.when}</Text>
            </View>
            <Text style={styles.itemMessage}>{item.message}</Text>
            <View style={styles.itemFooter}>
              <View
                style={[
                  styles.kindChip,
                  item.kind === 'reminder' && styles.kindChipReminder,
                ]}>
                <Text
                  style={[
                    styles.kindChipText,
                    item.kind === 'reminder' && styles.kindChipTextReminder,
                  ]}>
                  {item.kind === 'confirmed' ? 'Confirmed' : 'Reminder'}
                </Text>
              </View>
              <Text style={styles.itemDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
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
  infoCard: {
    backgroundColor: '#E9EDF9',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#12203F',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3A425A',
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
    alignItems: 'center',
    gap: 8,
  },
  kindDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },
  kindDotReminder: {
    backgroundColor: '#1D4ED8',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#12203F',
    flex: 1,
  },
  itemWhen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A8199',
  },
  itemMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A5165',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  kindChip: {
    backgroundColor: '#E7F5EC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kindChipReminder: {
    backgroundColor: '#EEF1F8',
  },
  kindChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  kindChipTextReminder: {
    color: '#1D4ED8',
  },
  itemDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A8199',
  },
});
