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

  const fetchOccupancy = async () => {
    try {
      const res = await staffApi.getOccupancy();
      if (res.success) {
        setRooms(res.data.rooms);
      }
    } catch {
      // Handled by service fallbacks
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
      await staffApi.updateSeatStatus(selectedSeat._id, newStatus);
      setSelectedSeat((prev) => (prev ? { ...prev, status: newStatus } : null));
      setFeedback(`Seat ${selectedSeat.seatNumber} set to ${newStatus}`);
      setTimeout(() => setFeedback(''), 3000);
      fetchOccupancy();
    } catch {
      // Handled
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
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
                <Text style={styles.roomName}>{roomA?.name || 'Reading Room A'}</Text>
                <Text style={styles.roomLocation}>
                  {roomA?.floor || 'Floor 02'} • {roomA?.wing || 'West Wing'}
                </Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE CHECK</Text>
              </View>
            </View>

            <View style={styles.occupancyBarRow}>
              <Text style={styles.occupancyStats}>
                <Text style={styles.occupiedBold}>{roomA?.occupiedSeats || 18}</Text> /{' '}
                {roomA?.totalSeats || 30} seats occupied
              </Text>
              <Text style={styles.freeSeatsText}>
                {roomA?.availableSeats || 12} seats free
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round(
                      ((roomA?.occupiedSeats || 18) / (roomA?.totalSeats || 30)) * 100
                    )}%`,
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
                return (
                  <TouchableOpacity
                    key={seat._id || seat.seatNumber}
                    style={[
                      styles.seatBtn,
                      isOccupied ? styles.seatOccupied : styles.seatAvailable,
                    ]}
                    onPress={() => setSelectedSeat(seat)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.seatNumberText,
                        isOccupied ? styles.textOccupied : styles.textAvailable,
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
                <Text style={styles.roomName}>{roomB?.name || 'Reading Room B'}</Text>
                <Text style={styles.roomLocation}>
                  {roomB?.floor || 'Floor 02'} • {roomB?.wing || 'East Wing'}
                </Text>
              </View>
              <View style={styles.quietBadge}>
                <Text style={styles.quietText}>OPEN</Text>
              </View>
            </View>

            <View style={styles.occupancyBarRow}>
              <Text style={styles.occupancyStats}>
                <Text style={styles.occupiedBold}>{roomB?.occupiedSeats || 0}</Text> /{' '}
                {roomB?.totalSeats || 20} seats occupied
              </Text>
              <Text style={styles.freeSeatsText}>
                {roomB?.availableSeats || 20} seats free
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '0%' }]} />
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
                    : styles.badgeAvailable,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeSmallText,
                    selectedSeat?.status === 'occupied'
                      ? styles.badgeOccupiedText
                      : styles.badgeAvailableText,
                  ]}>
                  {selectedSeat?.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.seatModalRoom}>
              {selectedSeat?.room} • Floor 02
            </Text>

            {selectedSeat?.occupiedBy?.studentName ? (
              <View style={styles.occupantCard}>
                <Text style={styles.occupantLabel}>CURRENT OCCUPANT</Text>
                <Text style={styles.occupantName}>
                  {selectedSeat.occupiedBy.studentName}
                </Text>
                <Text style={styles.occupantMeta}>
                  Student ID: {selectedSeat.occupiedBy.studentId}
                </Text>
                <Text style={styles.occupantMeta}>
                  Time Slot: {selectedSeat.occupiedBy.startTime} - {selectedSeat.occupiedBy.endTime}
                </Text>
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
    backgroundColor: '#F8FAFC',
  },
  feedbackBanner: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
  },
  feedbackText: {
    color: '#15803D',
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
    color: '#64748B',
    fontSize: 14,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  roomLocation: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginRight: 6,
  },
  liveText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  quietBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quietText: {
    color: '#475569',
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
    color: '#334155',
    fontSize: 14,
  },
  occupiedBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  freeSeatsText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  matrixTitle: {
    color: '#475569',
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
    backgroundColor: '#1E293B',
  },
  availableBox: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectedBox: {
    backgroundColor: '#3B82F6',
  },
  legendLabel: {
    color: '#64748B',
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
    backgroundColor: '#1E293B',
    borderColor: '#0F172A',
  },
  seatAvailable: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  seatNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textOccupied: {
    color: '#FFFFFF',
  },
  textAvailable: {
    color: '#166534',
  },
  noShowsNavButton: {
    backgroundColor: '#1E293B',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  noShowsBtnSub: {
    color: '#94A3B8',
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
    backgroundColor: '#FFFFFF',
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
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOccupied: {
    backgroundColor: '#FEE2E2',
  },
  badgeOccupiedText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 11,
  },
  badgeAvailable: {
    backgroundColor: '#DCFCE7',
  },
  badgeAvailableText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 11,
  },
  statusBadgeSmallText: {},
  seatModalRoom: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 16,
  },
  occupantCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  occupantLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  occupantName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  occupantMeta: {
    color: '#475569',
    fontSize: 12,
  },
  availableDeskNotice: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  availableNoticeText: {
    color: '#166534',
    fontSize: 13,
    lineHeight: 18,
  },
  toggleSeatBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleSeatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeSeatBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeSeatText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
