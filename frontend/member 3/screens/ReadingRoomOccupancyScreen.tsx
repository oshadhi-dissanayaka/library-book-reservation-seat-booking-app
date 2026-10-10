import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { StaffHeader } from '../components/StaffHeader';
import { staffApi } from '../services/staffApi';
import { staffTheme } from '../theme/staffTheme';
import { ReadingRoomInfo, Seat } from '../types/staff.types';

interface ReadingRoomOccupancyScreenProps {
  onNavigateNoShows: () => void;
  staffId?: string;
}

export const ReadingRoomOccupancyScreen: React.FC<
  ReadingRoomOccupancyScreenProps
> = ({ onNavigateNoShows, staffId = 'STF-4092' }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<ReadingRoomInfo[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const fetchOccupancy = async () => {
    try {
      const res = await staffApi.getOccupancy();
      if (res.success) {
        setRooms(res.data.rooms);
        setError('');
      } else {
        setRooms([]);
        setError(res.message || 'Failed to load reading room occupancy.');
      }
    } catch {
      setError('Failed to load reading room occupancy.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOccupancy();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOccupancy();
  };

  const handleToggleSeat = async () => {
    if (!selectedSeat) return;
    const newStatus = selectedSeat.status === 'occupied' ? 'available' : 'occupied';
    try {
      const res = await staffApi.updateSeatStatus(selectedSeat._id, newStatus);
      if (res.success) {
        setSelectedSeat((prev) => (prev ? { ...prev, status: newStatus } : null));
        setFeedback(`Seat ${selectedSeat.seatNumber} set to ${newStatus}`);
        setTimeout(() => setFeedback(''), 3000);
        fetchOccupancy();
      } else {
        setError(res.message || 'Failed to update seat status.');
      }
    } catch {
      setError('Failed to update seat status.');
    }
  };

  const roomA = rooms.find((r) => r.name.includes('Room A')) || rooms[0];
  const roomB = rooms.find((r) => r.name.includes('Room B')) || rooms[1];

  const seatsList = roomA?.seats || [];

  return (
    <View style={styles.container}>
      <StaffHeader
        title="Reading Room"
        subtitle="Live Floor Occupancy Check"
        staffId={staffId}
        desk="Circulation Desk 01"
      />

      {feedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>✓ {feedback}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={staffTheme.navy} />
          <Text style={styles.loadingText}>Fetching seat occupancy map...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Room A Card */}
          <View style={styles.roomCard}>
            <View style={styles.roomHeaderRow}>
              <View>
                <Text style={styles.roomName}>{roomA?.name || '—'}</Text>
                <Text style={styles.roomLocation}>
                  {roomA?.floor || '—'} • {roomA?.wing || '—'}
                </Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE CHECK</Text>
              </View>
            </View>

            <View style={styles.occupancyBarRow}>
              <Text style={styles.occupancyStats}>
                <Text style={styles.occupiedBold}>{roomA?.occupiedSeats ?? 0}</Text> /{' '}
                {roomA?.totalSeats ?? 0} seats occupied
              </Text>
              <Text style={styles.freeSeatsText}>
                {roomA?.availableSeats ?? 0} seats free
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      roomA && roomA.totalSeats > 0
                        ? Math.round((roomA.occupiedSeats / roomA.totalSeats) * 100)
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            {/* Interactive Matrix Title */}
            <Text style={styles.matrixTitle}>INTERACTIVE SEAT MAP (ROOM A)</Text>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.occupiedBox]} />
                <Text style={styles.legendLabel}>Occupied</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.reservedBox]} />
                <Text style={styles.legendLabel}>Reserved</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.availableBox]} />
                <Text style={styles.legendLabel}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.selectedBox]} />
                <Text style={styles.legendLabel}>Tap to Inspect</Text>
              </View>
            </View>

            {/* Seat Grid */}
            <View style={styles.seatGrid}>
              {seatsList.map((seat) => {
                const isOccupied = seat.status === 'occupied';
                const isReserved = seat.status === 'reserved';
                return (
                  <TouchableOpacity
                    key={seat._id || seat.seatNumber}
                    style={[
                      styles.seatBtn,
                      isOccupied
                        ? styles.seatOccupied
                        : isReserved
                          ? styles.seatReserved
                          : styles.seatAvailable,
                    ]}
                    onPress={() => setSelectedSeat(seat)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.seatNumberText,
                        isOccupied
                          ? styles.textOccupied
                          : isReserved
                            ? styles.textReserved
                            : styles.textAvailable,
                      ]}>
                      {seat.seatNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Room B Card */}
          <View style={styles.roomCard}>
            <View style={styles.roomHeaderRow}>
              <View>
                <Text style={styles.roomName}>{roomB?.name || '—'}</Text>
                <Text style={styles.roomLocation}>
                  {roomB?.floor || '—'} • {roomB?.wing || '—'}
                </Text>
              </View>
              <View style={styles.quietBadge}>
                <Text style={styles.quietText}>OPEN</Text>
              </View>
            </View>

            <View style={styles.occupancyBarRow}>
              <Text style={styles.occupancyStats}>
                <Text style={styles.occupiedBold}>{roomB?.occupiedSeats ?? 0}</Text> /{' '}
                {roomB?.totalSeats ?? 0} seats occupied
              </Text>
              <Text style={styles.freeSeatsText}>
                {roomB?.availableSeats ?? 0} seats free
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      roomB && roomB.totalSeats > 0
                        ? Math.round((roomB.occupiedSeats / roomB.totalSeats) * 100)
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* No-Shows and Cancellations Action Button */}
          <TouchableOpacity
            style={styles.noShowsNavButton}
            onPress={onNavigateNoShows}
            activeOpacity={0.8}>
            <View style={styles.noShowsBtnContent}>
              <Text style={styles.noShowsBtnTitle}>No-shows & Cancellations →</Text>
              <Text style={styles.noShowsBtnSub}>
                Manage uncollected bookings & release occupied desks
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Seat Inspector Modal */}
      <Modal
        visible={!!selectedSeat}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSeat(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.seatModalCard}>
            <View style={styles.seatModalHeader}>
              <Text style={styles.seatModalTitle}>
                Seat {selectedSeat?.seatNumber}
              </Text>
              <View
                style={[
                  styles.statusBadgeSmall,
                  selectedSeat?.status === 'occupied'
                    ? styles.badgeOccupied
                    : selectedSeat?.status === 'reserved'
                      ? styles.badgeReserved
                      : styles.badgeAvailable,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeSmallText,
                    selectedSeat?.status === 'occupied'
                      ? styles.badgeOccupiedText
                      : selectedSeat?.status === 'reserved'
                        ? styles.badgeReservedText
                        : styles.badgeAvailableText,
                  ]}>
                  {selectedSeat?.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.seatModalRoom}>
              {selectedSeat?.room}
              {selectedSeat?.floor ? ` • ${selectedSeat.floor}` : ''}
            </Text>

            {selectedSeat?.occupiedBy?.studentName ||
            selectedSeat?.occupiedBy?.studentId ? (
              <View style={styles.occupantCard}>
                <Text style={styles.occupantLabel}>
                  {selectedSeat?.status === 'reserved'
                    ? 'RESERVED FOR'
                    : 'CURRENT OCCUPANT'}
                </Text>
                {selectedSeat?.occupiedBy?.studentName ? (
                  <Text style={styles.occupantName}>
                    {selectedSeat.occupiedBy.studentName}
                  </Text>
                ) : null}
                <Text style={styles.occupantMeta}>
                  Student ID: {selectedSeat?.occupiedBy?.studentId}
                </Text>
                {selectedSeat?.occupiedBy?.startTime ? (
                  <Text style={styles.occupantMeta}>
                    Time Slot: {selectedSeat.occupiedBy.startTime}
                    {selectedSeat.occupiedBy.endTime
                      ? ` - ${selectedSeat.occupiedBy.endTime}`
                      : ''}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.availableDeskNotice}>
                <Text style={styles.availableNoticeText}>
                  This seat is currently unallocated and available for walk-in or advance booking.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.toggleSeatBtn}
              onPress={handleToggleSeat}
              activeOpacity={0.8}>
              <Text style={styles.toggleSeatText}>
                {selectedSeat?.status === 'occupied'
                  ? 'Mark as Free / Vacate Seat'
                  : 'Mark as Occupied'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeSeatBtn}
              onPress={() => setSelectedSeat(null)}>
              <Text style={styles.closeSeatText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staffTheme.canvas,
  },
  feedbackBanner: {
    backgroundColor: staffTheme.paleGreen,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: staffTheme.greenLine,
    alignItems: 'center',
  },
  feedbackText: {
    color: staffTheme.green,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: staffTheme.paleRed,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: staffTheme.redLine,
  },
  errorText: {
    color: staffTheme.red,
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: staffTheme.muted,
    fontSize: 14,
  },
  roomCard: {
    backgroundColor: staffTheme.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: staffTheme.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomName: {
    color: staffTheme.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  roomLocation: {
    color: staffTheme.muted,
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staffTheme.paleBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: staffTheme.navy,
    marginRight: 6,
  },
  liveText: {
    color: staffTheme.navy,
    fontSize: 10,
    fontWeight: '800',
  },
  quietBadge: {
    backgroundColor: staffTheme.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quietText: {
    color: staffTheme.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  occupancyBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupancyStats: {
    color: staffTheme.ink,
    fontSize: 14,
  },
  occupiedBold: {
    fontWeight: '800',
    color: staffTheme.ink,
  },
  freeSeatsText: {
    color: staffTheme.green,
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: staffTheme.canvas,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: staffTheme.navy,
    borderRadius: 4,
  },
  matrixTitle: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  occupiedBox: {
    backgroundColor: staffTheme.navy,
  },
  reservedBox: {
    backgroundColor: staffTheme.paleAmber,
    borderWidth: 1,
    borderColor: staffTheme.amberLine,
  },
  availableBox: {
    backgroundColor: staffTheme.seatFreeBg,
    borderWidth: 1,
    borderColor: staffTheme.seatFreeLine,
  },
  selectedBox: {
    backgroundColor: staffTheme.blue,
  },
  legendLabel: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  seatBtn: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  seatOccupied: {
    backgroundColor: staffTheme.navy,
    borderColor: staffTheme.navy,
  },
  seatReserved: {
    backgroundColor: staffTheme.paleAmber,
    borderColor: staffTheme.amberLine,
  },
  seatAvailable: {
    backgroundColor: staffTheme.seatFreeBg,
    borderColor: staffTheme.seatFreeLine,
  },
  seatNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textOccupied: {
    color: staffTheme.white,
  },
  textReserved: {
    color: staffTheme.amber,
  },
  textAvailable: {
    color: staffTheme.ink,
  },
  noShowsNavButton: {
    backgroundColor: staffTheme.navy,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  noShowsBtnContent: {
    alignItems: 'center',
  },
  noShowsBtnTitle: {
    color: staffTheme.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  noShowsBtnSub: {
    color: staffTheme.navyCopy,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  seatModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: staffTheme.white,
    borderRadius: 20,
    padding: 24,
  },
  seatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seatModalTitle: {
    color: staffTheme.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOccupied: {
    backgroundColor: staffTheme.navy,
  },
  badgeOccupiedText: {
    color: staffTheme.white,
    fontWeight: '700',
    fontSize: 11,
  },
  badgeAvailable: {
    backgroundColor: staffTheme.paleGreen,
  },
  badgeAvailableText: {
    color: staffTheme.green,
    fontWeight: '700',
    fontSize: 11,
  },
  badgeReserved: {
    backgroundColor: staffTheme.paleAmber,
  },
  badgeReservedText: {
    color: staffTheme.amber,
    fontWeight: '700',
    fontSize: 11,
  },
  statusBadgeSmallText: {},
  seatModalRoom: {
    color: staffTheme.muted,
    fontSize: 13,
    marginBottom: 16,
  },
  occupantCard: {
    backgroundColor: staffTheme.canvas,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: staffTheme.line,
  },
  occupantLabel: {
    color: staffTheme.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  occupantName: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  occupantMeta: {
    color: staffTheme.muted,
    fontSize: 12,
  },
  availableDeskNotice: {
    backgroundColor: staffTheme.paleGreen,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  availableNoticeText: {
    color: staffTheme.green,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleSeatBtn: {
    backgroundColor: staffTheme.navy,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleSeatText: {
    color: staffTheme.white,
    fontSize: 14,
    fontWeight: '700',
  },
  closeSeatBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeSeatText: {
    color: staffTheme.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
