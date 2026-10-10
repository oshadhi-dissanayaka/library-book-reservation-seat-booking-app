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

// Backend address — shared API configuration (src/lib/api.ts): the Expo
// dev-server host (works on a physical phone) and the backend's port 5000.
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

/** "2026-10-08" in local time, matching the reservation API format. */
function formatDateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/** "08 October 2026" — no date library needed. */
function formatDateLong(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getFullYear()}`;
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
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + index);
  return {
    iso: formatDateIso(date),
    label: formatDateLong(date),
  };
});

export default function ReadingRoomSearchScreen() {
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].iso);
  const [rooms, setRooms] = useState<ReadingRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedDateIndex = DATE_OPTIONS.findIndex((option) => option.iso === selectedDate);
  const selectedDateOption = DATE_OPTIONS[selectedDateIndex];
  const selectedRoom = rooms.find((room) => room._id === selectedRoomId) ?? null;

  const loadRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reading-rooms`);
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setRooms(Array.isArray(data.readingRooms) ? data.readingRooms : []);
    } catch (requestError) {
      setRooms([]);
      const detail =
        requestError instanceof Error ? requestError.message : 'Unknown error';
      setError(
        `Could not load reading rooms. ${detail}. Please check that the backend server is running.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.breadcrumb}>STUDY SPACES</Text>
      <Text style={styles.heading}>Reading Room Search</Text>
      <Text style={styles.subheading}>
        Select your preferred date and hall to browse real-time desk
        availability. You will choose a fixed 2-hour time block after picking
        a room.
      </Text>

      {/* Room and date selection */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Reading Room</Text>
          <Text style={styles.labelHint}>Required</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            selectedRoom ? `Selected room, ${selectedRoom.name}` : 'Select reading room'
          }
          accessibilityState={{ expanded: roomDropdownOpen, disabled: loading }}
          disabled={loading}
          style={[styles.selectField, loading && styles.controlDisabled]}
          onPress={() => setRoomDropdownOpen((open) => !open)}>
          <Text style={[styles.selectText, !selectedRoom && styles.placeholderText]}>
            {loading ? 'Loading reading rooms…' : selectedRoom?.name ?? 'Select Reading Room'}
          </Text>
          <Text style={styles.selectChevron}>{roomDropdownOpen ? '▴' : '▾'}</Text>
        </Pressable>

        {roomDropdownOpen && (
          <View style={styles.dropdownMenu}>
            {rooms.map((room) => {
              const isSelected = room._id === selectedRoomId;
              return (
                <Pressable
                  key={room._id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                  onPress={() => {
                    setSelectedRoomId(room._id);
                    setRoomDropdownOpen(false);
                  }}>
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextSelected,
                    ]}>
                    {room.name}
                  </Text>
                  {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.labelRow}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.labelHint}>Next 7 days only</Text>
        </View>
        <View style={styles.dateSelector}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select previous date"
            accessibilityState={{ disabled: selectedDateIndex === 0 }}
            disabled={selectedDateIndex === 0}
            style={[
              styles.dateArrowButton,
              selectedDateIndex === 0 && styles.controlDisabled,
            ]}
            onPress={() =>
              setSelectedDate(DATE_OPTIONS[Math.max(0, selectedDateIndex - 1)].iso)
            }>
            <Text style={styles.dateArrow}>▲</Text>
          </Pressable>

          <View style={styles.selectedDateCard}>
            <Text style={styles.dateContext}>
              {selectedDateIndex === 0 ? 'Today' : `Day ${selectedDateIndex + 1} of 7`}
            </Text>
            <Text style={styles.selectedDateText}>{selectedDateOption.label}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select next date"
            accessibilityState={{ disabled: selectedDateIndex === DATE_OPTIONS.length - 1 }}
            disabled={selectedDateIndex === DATE_OPTIONS.length - 1}
            style={[
              styles.dateArrowButton,
              selectedDateIndex === DATE_OPTIONS.length - 1 && styles.controlDisabled,
            ]}
            onPress={() =>
              setSelectedDate(
                DATE_OPTIONS[Math.min(DATE_OPTIONS.length - 1, selectedDateIndex + 1)].iso
              )
            }>
            <Text style={styles.dateArrow}>▼</Text>
          </Pressable>
        </View>
      </View>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.stateText}>Loading reading rooms…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={loadRooms}>
            <Text style={styles.primaryButtonText}>TRY AGAIN</Text>
          </Pressable>
        </View>
      )}

      {!loading && error === '' && rooms.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.stateText}>No reading rooms available</Text>
        </View>
      )}

      {!loading && error === '' && selectedRoom && (
          <View style={styles.card}>
            <Text style={styles.roomName}>{selectedRoom.name}</Text>
            <Text style={styles.roomMeta}>
              {selectedRoom.building} · Floor {selectedRoom.floor}
            </Text>

            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selectedRoom.zone}</Text>
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
                {formatTime(selectedRoom.openingTime)} – {formatTime(selectedRoom.closingTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total seats</Text>
              <Text style={styles.detailValue}>{selectedRoom.totalSeats} seats</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View available seats in ${selectedRoom.name}`}
              style={styles.primaryButton}
              onPress={() => {
                // WF-10: open the seat grid for this room + date. Time is
                // chosen on WF-10 as a fixed 2-hour block.
                router.push({
                  pathname: '/reading-rooms/[id]/seats',
                  params: {
                    id: selectedRoom._id,
                    // `isoDate` is what the APIs use ("YYYY-MM-DD"); `date`
                    // stays the friendly label purely for display on WF-10.
                    isoDate: selectedDate,
                    date: selectedDateOption.label,
                  },
                });
              }}>
              <Text style={styles.primaryButtonText}>VIEW AVAILABLE SEATS →</Text>
            </Pressable>
          </View>
      )}

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
  placeholderText: {
    color: '#7A8199',
  },
  dropdownMenu: {
    backgroundColor: '#EEF1F8',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7DDEC',
  },
  dropdownOption: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C9D2E8',
  },
  dropdownOptionSelected: {
    backgroundColor: '#DDE5F7',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#12203F',
  },
  dropdownOptionTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  dropdownCheck: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '800',
  },
  dateSelector: {
    alignItems: 'center',
    gap: 8,
  },
  dateArrowButton: {
    width: '100%',
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: '#EEF1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrow: {
    fontSize: 15,
    color: '#1E3A8A',
    fontWeight: '800',
  },
  selectedDateCard: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    gap: 2,
  },
  dateContext: {
    color: '#DDE5F7',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  controlDisabled: {
    opacity: 0.45,
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
