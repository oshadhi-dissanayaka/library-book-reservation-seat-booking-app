import { useState } from 'react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/**
 * WF-09 — Reading Room Search (IT3060 HCI Milestone 03)
 *
 * Loads reading rooms from the backend:
 *   GET /api/reading-rooms              -> all active rooms
 *   GET /api/reading-rooms?search=text  -> filtered by name/building/zone
 *
 * Date and time stay local UI state for now; seat availability (WF-10)
 * will use them in a later step.
 */

// Backend address. The project has no shared API config yet, so the host is
// taken from the address the device used to reach the Expo dev server — this
// works on a physical phone, an emulator, and web without editing any config
// file. Port 5000 is the backend default (see backend/server.js).
const API_HOST = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API_BASE_URL = `http://${API_HOST}:5000`;

type ReadingRoom = {
  _id: string;
  name: string;
  building: string;
  floor: string;
  zone: string;
  openingTime: string;
  closingTime: string;
  totalSeats: number;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "7 October 2026" — no date library needed. */
function formatDateLong(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Backend stores 24-hour "HH:mm" ("22:00"); the UI shows "10:00 PM". */
function formatTime(value: string): string {
  const [hourString, minute] = value.split(':');
  if (!hourString || !minute) {
    return value;
  }
  const hour = Number(hourString);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
}

// Today + the next 6 days (matches the "Next 7 days available" hint).
const DATE_OPTIONS = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return formatDateLong(date);
});

const TIME_OPTIONS = ['10:00 AM', '12:00 PM', '02:00 PM'];

export default function ReadingRoomSearchScreen() {
  const [date, setDate] = useState(DATE_OPTIONS[0]);
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [rooms, setRooms] = useState<ReadingRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const query = search.trim();
      const url = query
        ? `${API_BASE_URL}/api/reading-rooms?search=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/reading-rooms`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setRooms(Array.isArray(data.readingRooms) ? data.readingRooms : []);
      setSearched(true);
    } catch (requestError) {
      setRooms([]);
      setSearched(true);
      const detail =
        requestError instanceof Error ? requestError.message : 'Unknown error';
      setError(
        `Could not load reading rooms. ${detail}. Please check that the backend server is running.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.breadcrumb}>STUDY SPACES</Text>
      <Text style={styles.heading}>Reading Room Search</Text>
      <Text style={styles.subheading}>
        Select your preferred date, time slot, and hall to browse real-time desk
        availability.
      </Text>

      {/* Search form */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.labelHint}>Next 7 days available</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change date, currently ${date}`}
          style={styles.selectField}
          onPress={() =>
            setDate(DATE_OPTIONS[(DATE_OPTIONS.indexOf(date) + 1) % DATE_OPTIONS.length])
          }>
          <Text style={styles.selectText}>{date}</Text>
          <Text style={styles.selectChevron}>▾</Text>
        </Pressable>

        {/* Time */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.labelHint}>2-hour block slots</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change time, currently ${time}`}
          style={styles.selectField}
          onPress={() =>
            setTime(TIME_OPTIONS[(TIME_OPTIONS.indexOf(time) + 1) % TIME_OPTIONS.length])
          }>
          <Text style={styles.selectText}>{time}</Text>
          <Text style={styles.selectChevron}>▾</Text>
        </Pressable>

        {/* Room search */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Room</Text>
          <Text style={styles.labelHint}>Building East Wing</Text>
        </View>
        <TextInput
          accessibilityLabel="Search reading rooms"
          style={styles.input}
          placeholder="Search room name, building or zone"
          placeholderTextColor="#8A90A2"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search available reading rooms"
          style={styles.primaryButton}
          onPress={handleSearch}>
          <Text style={styles.primaryButtonText}>SEARCH →</Text>
        </Pressable>
      </View>

      {/* Results — loaded from GET /api/reading-rooms */}
      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.stateText}>Loading reading rooms…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && error === '' && searched && rooms.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.stateText}>No reading rooms found</Text>
        </View>
      )}

      {!loading &&
        error === '' &&
        rooms.map((room) => (
          <View key={room._id} style={styles.card}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomMeta}>
              {room.building} · Floor {room.floor}
            </Text>

            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{room.zone}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Power at Every Desk</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>High-speed Eduroam</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Opening hours</Text>
              <Text style={styles.detailValue}>
                {formatTime(room.openingTime)} – {formatTime(room.closingTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total seats</Text>
              <Text style={styles.detailValue}>{room.totalSeats} seats</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View available seats in ${room.name}`}
              style={styles.primaryButton}
              onPress={() => {
                // WF-10: open the seat grid for this room with the chosen date/time.
                router.push({
                  pathname: '/reading-rooms/[id]/seats',
                  params: { id: room._id, date, time },
                });
              }}>
              <Text style={styles.primaryButtonText}>VIEW AVAILABLE SEATS →</Text>
            </Pressable>
          </View>
        ))}

      {/* Guidelines */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Reading Room Guidelines</Text>
        <Text style={styles.infoText}>
          Reservations are held for 15 minutes past the booking start time. Please
          silence all mobile devices before entering Reading Room A. Desk check-in is
          verified automatically at the entryway terminal.
        </Text>
        <Text style={styles.infoMeta}>08:00 AM – 10:00 PM · Student ID Required</Text>
      </View>
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
    lineHeight: 21,
    color: '#4A5165',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#12203F',
  },
  labelHint: {
    fontSize: 12,
    color: '#7A8199',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF1F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 16,
    color: '#12203F',
    fontWeight: '600',
  },
  selectChevron: {
    fontSize: 16,
    color: '#4A5165',
  },
  input: {
    backgroundColor: '#EEF1F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#12203F',
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  infoMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});
