import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

/**
 * WF-10 + WF-11 - Seat Availability & Seat Reservation (IT3060 HCI Milestone 03)
 *
 * Data sources (all real, no placeholder occupancy):
 * - Room info:        GET /api/reading-rooms   (matched by route param `id`)
 * - Occupied seats:   GET /api/seat-reservations?readingRoom&date&time
 * - Reserve a seat:   POST /api/seat-reservations   (WF-11)
 * - On success:       navigate to /reservations/[id]/confirmation (WF-12)
 */

import { API_ORIGIN as API_BASE_URL } from '@/lib/api';
import { currentStudentId } from '@/lib/student-identity';
import { SeatLegend } from '@/components/m2';

type ReadingRoom = {
  _id: string;
  name: string;
  building: string;
  floor: string;
  zone: string;
  totalSeats: number;
  openingTime: string;
  closingTime: string;
};

type ReservationSummary = {
  _id: string;
  readingRoom: string;
  date: string;
  time: string;
  seatNumber: number;
  status: string;
};

type CreatedReservation = {
  _id?: string;
  reservationIds?: string[];
  message?: string;
  seatNumber?: number;
  status?: string;
  confirmationCode?: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toIsoDate(label: string): string | null {
  const parts = label.split(' ');
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const monthIndex = MONTH_NAMES.indexOf(parts[1]);
  const year = Number(parts[2]);
  if (!day || monthIndex < 0 || !year) return null;
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toMinutesSinceMidnight(value: string): number {
  const parts = value.split(':');
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN;
  return hour * 60 + minute;
}

function formatBlockEdge(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function buildTimeBlocks(openingTime: string, closingTime: string): string[] {
  const BLOCK_MINUTES = 120;
  const open = toMinutesSinceMidnight(openingTime);
  const close = toMinutesSinceMidnight(closingTime);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return [];
  const blocks: string[] = [];
  for (let from = open; from + BLOCK_MINUTES <= close; from += BLOCK_MINUTES) {
    blocks.push(`${formatBlockEdge(from)} \u2013 ${formatBlockEdge(from + BLOCK_MINUTES)}`);
  }
  return blocks;
}

function formatContinuousRange(blocks: string[]): string {
  if (blocks.length === 0) return '';
  if (blocks.length === 1) return blocks[0];
  const firstStart = blocks[0].split(' \u2013 ')[0];
  const lastEnd = blocks[blocks.length - 1].split(' \u2013 ')[1];
  return firstStart && lastEnd ? `${firstStart} \u2013 ${lastEnd}` : blocks.join(', ');
}

async function fetchOccupiedSeatsForBlocks(
  roomId: string,
  isoDate: string,
  blocks: string[]
): Promise<number[]> {
  const reservationLists = await Promise.all(
    blocks.map(async (block) => {
      const reservationsUrl =
        `${API_BASE_URL}/api/seat-reservations?readingRoom=${encodeURIComponent(roomId)}` +
        `&date=${isoDate}&time=${encodeURIComponent(block)}`;
      const response = await fetch(reservationsUrl);
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      const data = await response.json();
      return Array.isArray(data.reservations) ? (data.reservations as ReservationSummary[]) : [];
    })
  );
  return [
    ...new Set(
      reservationLists
        .flat()
        .filter((reservation) => reservation.status === 'active')
        .map((reservation) => reservation.seatNumber)
    ),
  ];
}

export default function SeatAvailabilityScreen() {
  const { id, date, isoDate: isoDateParam } = useLocalSearchParams<{
    id?: string;
    date?: string;
    isoDate?: string;
  }>();

  const { width } = useWindowDimensions();

  const [room, setRoom] = useState<ReadingRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<number[]>([]);
  const [occupancyLoading, setOccupancyLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reserveError, setReserveError] = useState('');

  const isoDate = isoDateParam ?? (date ? toIsoDate(date) : null);

  // Responsive seat dimensions
  const COLS = width < 360 ? 5 : 6;
  const seatGap = 8;
  const seatSize = Math.max(40, Math.floor((width - 36 - 32 - seatGap * (COLS - 1)) / COLS));

  useEffect(() => {
    let active = true;
    const loadRoom = async () => {
      setLoading(true);
      setError('');
      try {
        if (!isoDate) {
          setError('Date not selected. Please go back and pick a date on the Reading Room Search screen.');
          return;
        }
        const roomsResponse = await fetch(`${API_BASE_URL}/api/reading-rooms`);
        if (!roomsResponse.ok) throw new Error(`Server responded with status ${roomsResponse.status}`);
        const roomsData = await roomsResponse.json();
        const rooms: ReadingRoom[] = Array.isArray(roomsData.readingRooms) ? roomsData.readingRooms : [];
        const found = rooms.find((roomItem) => roomItem._id === id);
        if (!found) {
          if (active) setError('Reading room not found.');
          return;
        }
        if (!active) return;
        const blocks = buildTimeBlocks(found.openingTime, found.closingTime);
        setRoom(found);
        setTimeBlocks(blocks);
        setSelectedTimes([]);
        setOccupancyLoading(false);
      } catch (requestError) {
        if (!active) return;
        const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(`Could not load this reading room. ${detail}. Please check that the backend server is running.`);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRoom();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!id || !isoDate || selectedTimes.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReservedSeats([]);
      setSelectedSeat(null);
      setOccupancyLoading(false);
      return () => { active = false; };
    }
    const loadOccupancy = async () => {
      setOccupancyLoading(true);
      setReservedSeats([]);
      setSelectedSeat(null);
      setReserveError('');
      try {
        const taken = await fetchOccupiedSeatsForBlocks(id, isoDate, selectedTimes);
        if (active) setReservedSeats(taken);
      } catch (requestError) {
        if (!active) return;
        const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(`Could not load seat availability. ${detail}. Please check that the backend server is running.`);
      } finally {
        if (active) setOccupancyLoading(false);
      }
    };
    loadOccupancy();
    return () => { active = false; };
  }, [id, isoDate, selectedTimes]);

  const toggleTimeBlock = (block: string) => {
    const blockIndex = timeBlocks.indexOf(block);
    const selectedIndex = selectedTimes.indexOf(block);
    setSelectedSeat(null);
    setReservedSeats([]);
    setReserveError('');
    if (selectedIndex >= 0) {
      setOccupancyLoading(selectedIndex > 0);
      setSelectedTimes((current) => current.slice(0, selectedIndex));
      return;
    }
    if (selectedTimes.length === 0) {
      setOccupancyLoading(true);
      setSelectedTimes([block]);
      return;
    }
    const lastSelectedIndex = timeBlocks.indexOf(selectedTimes[selectedTimes.length - 1]);
    if (blockIndex === lastSelectedIndex + 1) {
      setOccupancyLoading(true);
      setSelectedTimes((current) => [...current, block]);
    }
  };

  const occupiedSeats = room ? reservedSeats.filter((seat) => seat >= 1 && seat <= room.totalSeats) : [];
  const availableCount = room ? room.totalSeats - occupiedSeats.length : 0;
  const isOccupied = (seat: number) => occupiedSeats.includes(seat);

  const toggleSeat = (seat: number) => {
    if (isOccupied(seat)) return;
    setReserveError('');
    setSelectedSeat((current) => (current === seat ? null : seat));
  };

  const handleReserve = async () => {
    if (selectedSeat === null || !room || !isoDate || selectedTimes.length === 0 || saving) return;
    setSaving(true);
    setReserveError('');
    try {
      const latestOccupiedSeats = await fetchOccupiedSeatsForBlocks(room._id, isoDate, selectedTimes);
      if (latestOccupiedSeats.includes(selectedSeat)) {
        setReserveError('This seat is no longer available for the selected time. Please choose another seat or time block.');
        setReservedSeats(latestOccupiedSeats);
        setSelectedSeat(null);
        return;
      }
      const isBatch = selectedTimes.length > 1;
      const endpoint = isBatch
        ? `${API_BASE_URL}/api/seat-reservations/batch`
        : `${API_BASE_URL}/api/seat-reservations`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId(),
          readingRoom: room._id,
          date: isoDate,
          ...(isBatch ? { blocks: selectedTimes } : { time: selectedTimes[0] }),
          seatNumber: selectedSeat,
        }),
      });
      let data: CreatedReservation | null = null;
      try { data = (await response.json()) as CreatedReservation; } catch { data = null; }
      if (response.status === 409) {
        setSelectedSeat(null);
        setReserveError(data?.message ?? 'One or more selected time blocks are no longer available. Please choose another time.');
        const refreshed = await fetchOccupiedSeatsForBlocks(room._id, isoDate, selectedTimes).catch(() => null);
        if (refreshed) setReservedSeats(refreshed);
        return;
      }
      if (!response.ok || !data || !data._id) {
        throw new Error(data?.message ?? `Server responded with status ${response.status}`);
      }
      router.push({
        pathname: '/reservations/[id]/confirmation',
        params: {
          id: data._id,
          confirmationCode: data.confirmationCode ?? '',
          roomName: room.name,
          building: room.building,
          floor: room.floor,
          date,
          time: formatContinuousRange(selectedTimes),
          blockCount: String(selectedTimes.length),
          seatNumber: String(selectedSeat),
          status: data.status ?? 'active',
        },
      });
    } catch (requestError) {
      const detail = requestError instanceof Error ? requestError.message : 'Unknown error';
      setReserveError(`Could not save your reservation. ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#2456B3" />
          <Text style={styles.stateText}>Loading room details...</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={[styles.stateCard, styles.errorCard]}>
          <Text style={styles.errorIcon}>{'\u26A0\uFE0F'}</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBodyText}>{error}</Text>
        </View>
      )}

      {!loading && error === '' && room && (
        <>
          {/* Room + date banner */}
          <View style={styles.roomBanner}>
            <View style={styles.roomBannerLeft}>
              <Text style={styles.roomBannerName}>{room.name}</Text>
              <Text style={styles.roomBannerMeta}>{room.building} {'\u00B7'} Floor {room.floor}</Text>
            </View>
            <View style={styles.roomBannerRight}>
              <Text style={styles.roomBannerDateLabel}>Date</Text>
              <Text style={styles.roomBannerDate}>{date || 'Not set'}</Text>
            </View>
          </View>

          {/* Time block selector */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Select Time Block</Text>
              <Text style={styles.cardTitleHint}>Fixed 2-hour blocks</Text>
            </View>

            {timeBlocks.length === 0 ? (
              <Text style={styles.stateText}>No time blocks available for this room.</Text>
            ) : (
              <View style={styles.timeChipGrid}>
                {Array.from({ length: Math.ceil(timeBlocks.length / 2) }, (_, rowIndex) => (
                  <View key={rowIndex} style={styles.timeChipRow}>
                    {timeBlocks.slice(rowIndex * 2, rowIndex * 2 + 2).map((block) => {
                      const blockIndex = timeBlocks.indexOf(block);
                      const isSelected = selectedTimes.includes(block);
                      const lastSelectedIndex =
                        selectedTimes.length > 0
                          ? timeBlocks.indexOf(selectedTimes[selectedTimes.length - 1])
                          : -1;
                      const isNextAdjacent = selectedTimes.length > 0 && blockIndex === lastSelectedIndex + 1;
                      const isDisabled = selectedTimes.length > 0 && !isSelected && !isNextAdjacent;
                      return (
                        <Pressable
                          key={block}
                          disabled={isDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={`Time block ${block}, ${isSelected ? 'selected' : isNextAdjacent || selectedTimes.length === 0 ? 'available' : 'unavailable until adjacent blocks are selected'}`}
                          accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                          style={[
                            styles.timeChip,
                            isSelected && styles.timeChipSelected,
                            isNextAdjacent && styles.timeChipAdjacent,
                            isDisabled && styles.timeChipDisabled,
                          ]}
                          onPress={() => toggleTimeBlock(block)}>
                          <Text
                            style={[
                              styles.timeChipText,
                              isSelected && styles.timeChipSelectedText,
                              isDisabled && styles.timeChipDisabledText,
                            ]}>
                            {block}
                          </Text>
                          {isSelected && <Text style={styles.timeChipCheck}>{'\u2713'}</Text>}
                          {isNextAdjacent && !isSelected && <Text style={styles.timeChipPlus}>+</Text>}
                        </Pressable>
                      );
                    })}
                    {rowIndex * 2 + 1 >= timeBlocks.length && <View style={{ flex: 1 }} />}
                  </View>
                ))}
              </View>
            )}

            {selectedTimes.length > 0 && (
              <View style={styles.rangeSummary}>
                <Text style={styles.rangeSummaryTime}>{formatContinuousRange(selectedTimes)}</Text>
                <Text style={styles.rangeSummaryMeta}>
                  {selectedTimes.length} x 2-hour {selectedTimes.length === 1 ? 'block' : 'blocks'} ({selectedTimes.length * 2} hrs total)
                </Text>
              </View>
            )}
            <Text style={styles.timeHelpText}>
              Select any starting block, then add the next adjacent block. Tap a selected block to remove it and every later block.
            </Text>
          </View>

          {/* Occupancy loading */}
          {occupancyLoading && (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color="#2456B3" />
              <Text style={styles.stateText}>Updating seat availability...</Text>
            </View>
          )}

          {/* Seat map - only after a time block is selected and occupancy loaded */}
          {!occupancyLoading && selectedTimes.length > 0 && (
            <>
              {/* Availability summary chips */}
              <View style={styles.availabilityRow}>
                <View style={[styles.availBadge, styles.availBadgeGreen]}>
                  <Text style={[styles.availBadgeNum, { color: '#16875B' }]}>{availableCount}</Text>
                  <Text style={[styles.availBadgeLabel, { color: '#16875B' }]}>Available</Text>
                </View>
                <View style={[styles.availBadge, styles.availBadgeRed]}>
                  <Text style={[styles.availBadgeNum, { color: '#B33535' }]}>{occupiedSeats.length}</Text>
                  <Text style={[styles.availBadgeLabel, { color: '#B33535' }]}>Reserved</Text>
                </View>
                <View style={[styles.availBadge, styles.availBadgeBlue]}>
                  <Text style={[styles.availBadgeNum, { color: '#2456B3' }]}>{room.totalSeats}</Text>
                  <Text style={[styles.availBadgeLabel, { color: '#2456B3' }]}>Total</Text>
                </View>
              </View>

              {/* Seat grid */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Choose Your Seat</Text>
                <SeatLegend />

                <View style={[styles.seatGrid, { gap: seatGap }]}>
                  {Array.from({ length: room.totalSeats }, (_, index) => index + 1).map((seat) => {
                    const occupied = isOccupied(seat);
                    const selected = selectedSeat === seat;
                    return (
                      <Pressable
                        key={seat}
                        disabled={occupied}
                        accessibilityRole="button"
                        accessibilityLabel={`Seat ${seat}, ${occupied ? 'reserved and unavailable' : selected ? 'selected' : 'available'}`}
                        accessibilityState={{ disabled: occupied, selected }}
                        style={[
                          styles.seat,
                          { width: seatSize, height: seatSize },
                          occupied && styles.seatOccupied,
                          selected && styles.seatSelected,
                        ]}
                        onPress={() => toggleSeat(seat)}>
                        {selected
                          ? <Text style={styles.seatCheckmark}>{'\u2713'}</Text>
                          : occupied
                            ? <Text style={styles.seatCross}>{'\u2715'}</Text>
                            : <Text style={styles.seatNum}>{seat}</Text>
                        }
                      </Pressable>
                    );
                  })}
                </View>

                {selectedSeat !== null ? (
                  <View style={styles.selectedSeatBanner}>
                    <Text style={styles.selectedSeatBannerText}>Seat {selectedSeat} selected</Text>
                  </View>
                ) : (
                  <Text style={styles.selectPrompt}>Tap an available seat above to select it</Text>
                )}

                {/* Booking summary when seat is chosen */}
                {selectedSeat !== null && (
                  <View style={styles.bookingSummary}>
                    <Text style={styles.bookingSummaryTitle}>Booking Summary</Text>
                    <View style={styles.bookingSummaryRow}>
                      <Text style={styles.bookingSummaryLabel}>Room</Text>
                      <Text style={styles.bookingSummaryValue}>{room.name}</Text>
                    </View>
                    <View style={styles.bookingSummaryRow}>
                      <Text style={styles.bookingSummaryLabel}>Seat</Text>
                      <Text style={styles.bookingSummaryValue}>Seat {selectedSeat}</Text>
                    </View>
                    <View style={styles.bookingSummaryRow}>
                      <Text style={styles.bookingSummaryLabel}>Date</Text>
                      <Text style={styles.bookingSummaryValue}>{date || 'Not selected'}</Text>
                    </View>
                    <View style={styles.bookingSummaryRow}>
                      <Text style={styles.bookingSummaryLabel}>Time</Text>
                      <Text style={styles.bookingSummaryValue}>{formatContinuousRange(selectedTimes)}</Text>
                    </View>
                    {selectedTimes.length > 1 && (
                      <View style={styles.bookingSummaryRow}>
                        <Text style={styles.bookingSummaryLabel}>Duration</Text>
                        <Text style={styles.bookingSummaryValue}>{selectedTimes.length * 2} hours</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Reserve button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reserve seat for ${selectedTimes.length} time block${selectedTimes.length === 1 ? '' : 's'}`}
                  disabled={selectedSeat === null || saving}
                  style={[
                    styles.reserveButton,
                    (selectedSeat === null || saving) && styles.reserveButtonDisabled,
                  ]}
                  onPress={handleReserve}>
                  {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
                  <Text style={styles.reserveButtonText}>
                    {saving
                      ? 'Reserving...'
                      : selectedSeat !== null
                        ? `Reserve Seat ${selectedSeat}`
                        : 'Select a Seat First'}
                  </Text>
                </Pressable>

                {!saving && reserveError !== '' && (
                  <View style={styles.inlineError}>
                    <Text style={styles.inlineErrorText}>{'\u26A0\uFE0F'}  {reserveError}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Guidelines */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Reading Room Guidelines</Text>
            <Text style={styles.infoCardText}>
              Seats are held for 15 minutes after the booking start time. Please keep
              noise to a minimum and carry your Student ID. Occupied seats shown here
              come from the live reservation lists for every selected 2-hour block.
            </Text>
          </View>
        </>
      )}
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
  stateText: { fontSize: 14, color: '#66738A', textAlign: 'center', lineHeight: 20 },
  errorCard: { borderLeftWidth: 3, borderLeftColor: '#B33535' },
  errorIcon: { fontSize: 28 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: '#17243F' },
  errorBodyText: { fontSize: 13, color: '#66738A', textAlign: 'center', lineHeight: 18 },

  roomBanner: {
    backgroundColor: '#102B69',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomBannerLeft: { gap: 3, flex: 1 },
  roomBannerName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  roomBannerMeta: { fontSize: 13, color: '#BEC9E8' },
  roomBannerRight: { alignItems: 'flex-end', gap: 2 },
  roomBannerDateLabel: { fontSize: 10, fontWeight: '700', color: '#8097CC', textTransform: 'uppercase', letterSpacing: 0.5 },
  roomBannerDate: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#12203F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#17243F' },
  cardTitleHint: { fontSize: 12, color: '#66738A' },

  timeChipGrid: { gap: 8 },
  timeChipRow: { flexDirection: 'row', gap: 8 },
  timeChip: {
    flex: 1,
    backgroundColor: '#EEF1F8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D7DDEC',
    paddingHorizontal: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  timeChipSelected: { backgroundColor: '#2456B3', borderColor: '#2456B3' },
  timeChipAdjacent: { borderColor: '#2456B3', backgroundColor: '#EAF0FC' },
  timeChipDisabled: { backgroundColor: '#F3F4F7', borderColor: '#E3E6EF', opacity: 0.5 },
  timeChipText: { fontSize: 12, fontWeight: '700', color: '#2456B3', flex: 1 },
  timeChipSelectedText: { color: '#FFFFFF' },
  timeChipDisabledText: { color: '#8A90A2' },
  timeChipCheck: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  timeChipPlus: { color: '#2456B3', fontWeight: '800', fontSize: 13 },

  rangeSummary: {
    backgroundColor: '#EAF0FC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 3,
  },
  rangeSummaryTime: { fontSize: 14, fontWeight: '800', color: '#17243F' },
  rangeSummaryMeta: { fontSize: 12, fontWeight: '700', color: '#2456B3' },
  timeHelpText: { fontSize: 12, color: '#66738A', lineHeight: 17 },

  availabilityRow: { flexDirection: 'row', gap: 8 },
  availBadge: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  availBadgeGreen: { backgroundColor: '#E8F6EF' },
  availBadgeRed: { backgroundColor: '#FDECEC' },
  availBadgeBlue: { backgroundColor: '#EAF0FC' },
  availBadgeNum: { fontSize: 22, fontWeight: '800' },
  availBadgeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  seatGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  seat: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1F8',
    borderWidth: 1.5,
    borderColor: '#D7DDEC',
  },
  seatOccupied: { backgroundColor: '#ECEEF3', borderColor: '#D3D8E4' },
  seatSelected: { backgroundColor: '#2456B3', borderColor: '#2456B3' },
  seatNum: { fontSize: 13, fontWeight: '700', color: '#17243F' },
  seatCheckmark: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  seatCross: { fontSize: 14, fontWeight: '800', color: '#A0A8BB' },

  selectedSeatBanner: {
    backgroundColor: '#EAF0FC',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  selectedSeatBannerText: { fontSize: 14, fontWeight: '800', color: '#2456B3' },
  selectPrompt: { fontSize: 13, color: '#66738A', textAlign: 'center' },

  bookingSummary: {
    backgroundColor: '#F4F6FB',
    borderRadius: 14,
    padding: 14,
    gap: 7,
  },
  bookingSummaryTitle: { fontSize: 13, fontWeight: '800', color: '#17243F', marginBottom: 2 },
  bookingSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingSummaryLabel: { fontSize: 13, color: '#66738A' },
  bookingSummaryValue: { fontSize: 13, fontWeight: '700', color: '#17243F', textAlign: 'right', maxWidth: '60%' },

  reserveButton: {
    backgroundColor: '#2456B3',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
    marginTop: 4,
  },
  reserveButtonDisabled: { opacity: 0.5 },
  reserveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  inlineError: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 12,
  },
  inlineErrorText: { fontSize: 13, color: '#B33535', fontWeight: '600', lineHeight: 18 },

  infoCard: { backgroundColor: '#E9EDF9', borderRadius: 20, padding: 18, gap: 8 },
  infoCardTitle: { fontSize: 15, fontWeight: '800', color: '#17243F' },
  infoCardText: { fontSize: 13, lineHeight: 19, color: '#3A425A' },
});
