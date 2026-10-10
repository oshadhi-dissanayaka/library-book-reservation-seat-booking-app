import { useEffect, useState } from 'react';
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
 * WF-09 — Reading Room Search (IT3060 HCI Milestone 03)
 *
 * Loads reading rooms from the backend:
 *   GET /api/reading-rooms              -> all active rooms
 * The chosen date is passed to WF-10. The fixed 2-hour time block is
 * selected on WF-10 (after the room is known), not here.
 */

import { API_ORIGIN as API_BASE_URL } from '@/lib/api';

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
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatDateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLong(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTime(value: string): string {
  const [hourString, minute] = value.split(':');
  if (!hourString || !minute) return value;
  const hour = Number(hourString);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
}

const DATE_OPTIONS = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + index);
  return {
    iso: formatDateIso(date),
    label: formatDateLong(date),
    dayName: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString('en-GB', { weekday: 'short' }),
    dayNum: String(date.getDate()),
  };
});

// Room icons by zone / name heuristic
function roomIcon(room: ReadingRoom): string {
  const z = room.zone.toLowerCase();
  if (z.includes('quiet') || z.includes('silent')) return '🔇';
  if (z.includes('group') || z.includes('collaborat')) return '👥';
  if (z.includes('computer') || z.includes('digital')) return '💻';
  return '📚';
}

export default function ReadingRoomSearchScreen() {
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].iso);
  const [rooms, setRooms] = useState<ReadingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedDateIndex = DATE_OPTIONS.findIndex((o) => o.iso === selectedDate);
  const selectedDateOption = DATE_OPTIONS[selectedDateIndex];

  const loadRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reading-rooms`);
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      const data = await response.json();
      setRooms(Array.isArray(data.readingRooms) ? data.readingRooms : []);
    } catch (requestError) {
      setRooms([]);
      const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
      setError(`Could not load reading rooms. ${detail}. Please check that the backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadRooms(); }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.breadcrumb}>STUDY SPACES</Text>
        <Text style={styles.subheading}>Choose a date and select a room to view real-time seat availability.</Text>
      </View>

      {/* Date picker — horizontal chip strip */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SELECT DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChipRow}>
          {DATE_OPTIONS.map((opt, index) => {
            const isSelected = opt.iso === selectedDate;
            return (
              <Pressable
                key={opt.iso}
                accessibilityRole="button"
                accessibilityLabel={`Select date ${opt.label}`}
                accessibilityState={{ selected: isSelected }}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                onPress={() => setSelectedDate(opt.iso)}>
                <Text style={[styles.dateChipDay, isSelected && styles.dateChipDaySelected]}>
                  {opt.dayName}
                </Text>
                <Text style={[styles.dateChipNum, isSelected && styles.dateChipNumSelected]}>
                  {opt.dayNum}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.selectedDatePill}>
          <Text style={styles.selectedDatePillText}>📅  {selectedDateOption?.label ?? ''}</Text>
        </View>
      </View>

      {/* Room list */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AVAILABLE ROOMS</Text>

        {loading && (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#2456B3" />
            <Text style={styles.stateText}>Loading reading rooms…</Text>
          </View>
        )}

        {!loading && error !== '' && (
          <View style={[styles.stateCard, styles.errorCard]}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Could not load rooms</Text>
            <Text style={styles.errorMessage}>Please check that the backend server is running and try again.</Text>
            <Pressable style={styles.retryButton} onPress={loadRooms} accessibilityRole="button" accessibilityLabel="Retry loading rooms">
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!loading && error === '' && rooms.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🏛️</Text>
            <Text style={styles.stateTitle}>No rooms available</Text>
            <Text style={styles.stateText}>There are no reading rooms configured at this time.</Text>
          </View>
        )}

        {!loading && error === '' && rooms.map((room) => (
          <View key={room._id} style={styles.roomCard}>
            {/* Card header */}
            <View style={styles.roomCardHeader}>
              <View style={styles.roomIconWrap}>
                <Text style={styles.roomIconText}>{roomIcon(room)}</Text>
              </View>
              <View style={styles.roomCardHeaderText}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomMeta}>{room.building} {'\u00B7'} Floor {room.floor}</Text>
              </View>
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openBadgeText}>Open</Text>
              </View>
            </View>

            {/* Zone tag row */}
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>{room.zone}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>⚡ Power at Desk</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>📶 Eduroam Wi-Fi</Text></View>
            </View>

            {/* Info rows */}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hours</Text>
              <Text style={styles.infoValue}>{formatTime(room.openingTime)} {'\u2013'} {formatTime(room.closingTime)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{room.totalSeats} seats</Text>
            </View>

            {/* CTA */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View available seats in ${room.name}`}
              cssInterop={false}
              style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
              onPress={() => {
                router.push({
                  pathname: '/reading-rooms/[id]/seats',
                  params: {
                    id: room._id,
                    isoDate: selectedDate,
                    date: selectedDateOption.label,
                  },
                });
              }}>
              <Text style={styles.viewButtonText}>View Seats</Text>
              <Text style={styles.viewButtonArrow}>→</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Guidelines */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Reading Room Guidelines</Text>
        <Text style={styles.infoCardText}>
          Reservations are held for 15 minutes past the booking start time.
          Please silence all mobile devices before entering.
          Desk check-in is verified at the entryway terminal.
        </Text>
        <Text style={styles.infoCardMeta}>08:00 AM {'\u2013'} 10:00 PM {'\u00B7'} Student ID Required</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 48, gap: 20 },

  pageHeader: { gap: 6 },
  breadcrumb: { fontSize: 11, fontWeight: '700', color: '#2456B3', letterSpacing: 1.2, textTransform: 'uppercase' },
  subheading: { fontSize: 14, lineHeight: 20, color: '#66738A' },

  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#66738A', letterSpacing: 1, textTransform: 'uppercase' },

  // Date chips
  dateChipRow: { gap: 8, paddingVertical: 2 },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E9F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 58,
    gap: 2,
  },
  dateChipSelected: { backgroundColor: '#102B69', borderColor: '#102B69' },
  dateChipDay: { fontSize: 11, fontWeight: '700', color: '#66738A', textTransform: 'uppercase', letterSpacing: 0.3 },
  dateChipDaySelected: { color: '#BEC9E8' },
  dateChipNum: { fontSize: 19, fontWeight: '800', color: '#17243F' },
  dateChipNumSelected: { color: '#FFFFFF' },
  selectedDatePill: {
    backgroundColor: '#EAF0FC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  selectedDatePillText: { fontSize: 13, fontWeight: '700', color: '#2456B3' },

  // State cards
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
  stateTitle: { fontSize: 16, fontWeight: '800', color: '#17243F', textAlign: 'center' },
  stateText: { fontSize: 14, color: '#66738A', textAlign: 'center', lineHeight: 20 },
  errorCard: { borderLeftWidth: 3, borderLeftColor: '#B33535' },
  errorIcon: { fontSize: 28 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: '#17243F' },
  errorMessage: { fontSize: 13, color: '#66738A', textAlign: 'center', lineHeight: 18 },
  retryButton: {
    marginTop: 4,
    backgroundColor: '#2456B3',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },

  // Room card
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#12203F',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomIconText: { fontSize: 22 },
  roomCardHeaderText: { flex: 1, gap: 2 },
  roomName: { fontSize: 17, fontWeight: '800', color: '#17243F' },
  roomMeta: { fontSize: 13, color: '#66738A' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F6EF', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16875B' },
  openBadgeText: { fontSize: 11, fontWeight: '800', color: '#16875B', letterSpacing: 0.4 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#EEF1F8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 11, fontWeight: '600', color: '#2456B3' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E9F1' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#66738A' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#17243F' },

  viewButton: {
    flexDirection: 'row',
    backgroundColor: '#2456B3',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    minHeight: 52,
    width: '100%',
  },
  viewButtonPressed: { opacity: 0.88 },
  viewButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  viewButtonArrow: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  // Info card
  infoCard: { backgroundColor: '#E9EDF9', borderRadius: 20, padding: 18, gap: 8 },
  infoCardTitle: { fontSize: 15, fontWeight: '800', color: '#17243F' },
  infoCardText: { fontSize: 13, lineHeight: 19, color: '#3A425A' },
  infoCardMeta: { fontSize: 12, fontWeight: '700', color: '#2456B3' },
});
