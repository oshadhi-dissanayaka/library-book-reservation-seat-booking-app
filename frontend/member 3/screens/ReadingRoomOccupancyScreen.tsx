import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  // Active room selected for interactive map view
  const [activeRoomName, setActiveRoomName] = useState<string>('Reading Room A');

  // Add Reading Room modal state
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomBuilding, setNewRoomBuilding] = useState('East Wing');
  const [newRoomFloor, setNewRoomFloor] = useState('Floor 03');
  const [newRoomZone, setNewRoomZone] = useState('Silent Study Zone');
  const [newRoomTotalSeats, setNewRoomTotalSeats] = useState('20');
  const [newRoomOpeningTime, setNewRoomOpeningTime] = useState('08:00');
  const [newRoomClosingTime, setNewRoomClosingTime] = useState('18:30');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [addRoomError, setAddRoomError] = useState('');

  // Add Seat modal state
  const [showAddSeatModal, setShowAddSeatModal] = useState(false);
  const [seatTargetRoom, setSeatTargetRoom] = useState('Reading Room A');
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [newSeatFloor, setNewSeatFloor] = useState('Floor 02');
  const [newSeatWing, setNewSeatWing] = useState('West Wing');
  const [newSeatStatus, setNewSeatStatus] = useState<'available' | 'maintenance'>('available');
  const [addingSeat, setAddingSeat] = useState(false);
  const [addSeatError, setAddSeatError] = useState('');

  const fetchOccupancy = async () => {
    try {
      const res = await staffApi.getOccupancy();
      if (res.success && res.data.rooms) {
        setRooms(res.data.rooms);
        if (
          res.data.rooms.length > 0 &&
          !res.data.rooms.some((r) => r.name.toLowerCase() === activeRoomName.toLowerCase())
        ) {
          setActiveRoomName(res.data.rooms[0].name);
        }
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

  const openAddRoomModal = () => {
    setNewRoomName('');
    setNewRoomBuilding('East Wing');
    setNewRoomFloor('Floor 03');
    setNewRoomZone('Silent Study Zone');
    setNewRoomTotalSeats('20');
    setNewRoomOpeningTime('08:00');
    setNewRoomClosingTime('18:30');
    setNewRoomDescription('');
    setAddRoomError('');
    setShowAddRoomModal(true);
  };

  const handleCreateRoom = async () => {
    setAddRoomError('');

    if (!newRoomName.trim()) {
      setAddRoomError('Please enter a reading room name (e.g. Reading Room D).');
      return;
    }
    if (!newRoomBuilding.trim()) {
      setAddRoomError('Please specify the building or wing.');
      return;
    }
    if (!newRoomFloor.trim()) {
      setAddRoomError('Please specify the floor (e.g. Floor 03).');
      return;
    }

    const seats = parseInt(newRoomTotalSeats, 10);
    if (isNaN(seats) || seats < 1) {
      setAddRoomError('Total capacity must be at least 1.');
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await staffApi.createReadingRoom({
        name: newRoomName.trim(),
        building: newRoomBuilding.trim(),
        floor: newRoomFloor.trim(),
        zone: newRoomZone.trim(),
        totalSeats: seats,
        openingTime: newRoomOpeningTime.trim() || '08:00',
        closingTime: newRoomClosingTime.trim() || '18:30',
        description: newRoomDescription.trim(),
        status: 'active',
        staffId,
      });

      if (res.success) {
        setShowAddRoomModal(false);
        setActiveRoomName(newRoomName.trim());
        setFeedback(`Reading room "${newRoomName.trim()}" created successfully.`);
        setTimeout(() => setFeedback(''), 4000);
        fetchOccupancy();
      } else {
        setAddRoomError(res.message || 'Failed to create reading room.');
      }
    } catch (err: any) {
      setAddRoomError(err.message || 'Error communicating with server.');
    } finally {
      setCreatingRoom(false);
    }
  };

  const openAddSeatModal = (targetRoomName?: string) => {
    const target = targetRoomName || activeRoomName || (rooms[0]?.name ?? 'Reading Room A');
    const matchedRoom =
      rooms.find((r) => r.name.toLowerCase() === target.toLowerCase()) || rooms[0];

    // Compute suggested seat code based on current seats in room
    let suggestedNumber = 'A01';
    if (matchedRoom?.seats && matchedRoom.seats.length > 0) {
      const lastSeat = matchedRoom.seats[matchedRoom.seats.length - 1]?.seatNumber;
      if (lastSeat) {
        const match = lastSeat.match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const num = parseInt(match[2], 10) + 1;
          suggestedNumber = `${prefix}${String(num).padStart(match[2].length, '0')}`;
        } else {
          suggestedNumber = `S${String(matchedRoom.seats.length + 1).padStart(2, '0')}`;
        }
      }
    }

    setSeatTargetRoom(matchedRoom?.name || 'Reading Room A');
    setNewSeatNumber(suggestedNumber);
    setNewSeatFloor(matchedRoom?.floor || 'Floor 02');
    setNewSeatWing(matchedRoom?.wing || 'West Wing');
    setNewSeatStatus('available');
    setAddSeatError('');
    setShowAddSeatModal(true);
  };

  const handleAddSeat = async () => {
    setAddSeatError('');

    if (!seatTargetRoom.trim()) {
      setAddSeatError('Please select a reading room.');
      return;
    }
    if (!newSeatNumber.trim()) {
      setAddSeatError('Please enter a seat number / code.');
      return;
    }

    setAddingSeat(true);
    try {
      const res = await staffApi.addSeat({
        room: seatTargetRoom.trim(),
        seatNumber: newSeatNumber.trim().toUpperCase(),
        floor: newSeatFloor.trim(),
        wing: newSeatWing.trim(),
        status: newSeatStatus,
        staffId,
      });

      if (res.success) {
        setShowAddSeatModal(false);
        setActiveRoomName(seatTargetRoom.trim());
        setFeedback(`Seat ${res.data.seatNumber} added to ${seatTargetRoom.trim()} successfully.`);
        setTimeout(() => setFeedback(''), 4000);
        fetchOccupancy();
      } else {
        setAddSeatError(res.message || 'Failed to add seat.');
      }
    } catch (err: any) {
      setAddSeatError(err.message || 'Error communicating with server.');
    } finally {
      setAddingSeat(false);
    }
  };

  const activeRoom =
    rooms.find((r) => r.name.toLowerCase() === activeRoomName.toLowerCase()) ||
    rooms[0] ||
    null;
  const activeSeats = activeRoom?.seats || [];

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
          {/* Top Action Bar */}
          <View style={styles.topActionsRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>
                READING ROOMS ({rooms.length})
              </Text>
            </View>
            <View style={styles.headerButtonsRow}>
              <TouchableOpacity
                style={styles.addRoomBtn}
                onPress={openAddRoomModal}
                activeOpacity={0.8}>
                <Text style={styles.addRoomBtnText}>+ Add Room</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addSeatBtn}
                onPress={() => openAddSeatModal(activeRoom?.name)}
                activeOpacity={0.8}>
                <Text style={styles.addSeatBtnText}>+ Add Seat</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reading Room Selection Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}>
            {rooms.map((r) => {
              const isSelected =
                activeRoom?.name.toLowerCase() === r.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={r._id || r.name}
                  style={[styles.roomChip, isSelected && styles.activeRoomChip]}
                  onPress={() => setActiveRoomName(r.name)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.roomChipText,
                      isSelected && styles.activeRoomChipText,
                    ]}>
                    {r.name}
                  </Text>
                  <View
                    style={[
                      styles.chipBadge,
                      isSelected && styles.activeChipBadge,
                    ]}>
                    <Text
                      style={[
                        styles.chipBadgeText,
                        isSelected && styles.activeChipBadgeText,
                      ]}>
                      {r.occupiedSeats}/{r.totalSeats}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Room Card */}
          {activeRoom && (
            <View style={styles.roomCard}>
              <View style={styles.roomHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{activeRoom.name}</Text>
                  <Text style={styles.roomLocation}>
                    {activeRoom.floor} • {activeRoom.wing}
                  </Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE CHECK</Text>
                </View>
              </View>

              <View style={styles.occupancyBarRow}>
                <Text style={styles.occupancyStats}>
                  <Text style={styles.occupiedBold}>{activeRoom.occupiedSeats}</Text> /{' '}
                  {activeRoom.totalSeats} seats occupied
                </Text>
                <Text style={styles.freeSeatsText}>
                  {activeRoom.availableSeats} seats free
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((activeRoom.occupiedSeats || 0) /
                            (activeRoom.totalSeats || 1)) *
                            100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>

              {/* Interactive Matrix Title & Add Seat Action */}
              <View style={styles.matrixHeaderRow}>
                <Text style={styles.matrixTitle}>
                  INTERACTIVE SEAT MAP ({activeRoom.name.toUpperCase()})
                </Text>
                <TouchableOpacity
                  style={styles.addSeatInlineBtn}
                  onPress={() => openAddSeatModal(activeRoom.name)}
                  activeOpacity={0.8}>
                  <Text style={styles.addSeatInlineBtnText}>+ Add Seat</Text>
                </TouchableOpacity>
              </View>

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
              {activeSeats.length > 0 ? (
                <View style={styles.seatGrid}>
                  {activeSeats.map((seat) => {
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
              ) : (
                <View style={styles.emptySeatsCard}>
                  <Text style={styles.emptySeatsTitle}>No individual seats allocated yet</Text>
                  <Text style={styles.emptySeatsSubtitle}>
                    Capacity is set to {activeRoom.totalSeats} seats. Add specific seat codes to enable floor check.
                  </Text>
                  <TouchableOpacity
                    style={styles.addFirstSeatBtn}
                    onPress={() => openAddSeatModal(activeRoom.name)}
                    activeOpacity={0.8}>
                    <Text style={styles.addFirstSeatBtnText}>+ Add First Seat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Other Rooms Overview Cards */}
          {rooms
            .filter((r) => r.name.toLowerCase() !== activeRoom?.name.toLowerCase())
            .map((otherRoom) => (
              <View key={otherRoom._id || otherRoom.name} style={styles.roomCard}>
                <View style={styles.roomHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomName}>{otherRoom.name}</Text>
                    <Text style={styles.roomLocation}>
                      {otherRoom.floor} • {otherRoom.wing}
                    </Text>
                  </View>
                  <View style={styles.quietBadge}>
                    <Text style={styles.quietText}>OPEN</Text>
                  </View>
                </View>

                <View style={styles.occupancyBarRow}>
                  <Text style={styles.occupancyStats}>
                    <Text style={styles.occupiedBold}>{otherRoom.occupiedSeats}</Text> /{' '}
                    {otherRoom.totalSeats} seats occupied
                  </Text>
                  <Text style={styles.freeSeatsText}>
                    {otherRoom.availableSeats} seats free
                  </Text>
                </View>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((otherRoom.occupiedSeats || 0) /
                              (otherRoom.totalSeats || 1)) *
                              100
                          )
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.roomCardFooterRow}>
                  <TouchableOpacity
                    style={styles.viewMapBtn}
                    onPress={() => setActiveRoomName(otherRoom.name)}
                    activeOpacity={0.7}>
                    <Text style={styles.viewMapBtnText}>
                      View Seat Map ({otherRoom.seats.length} seats) →
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addSeatSmallBtn}
                    onPress={() => openAddSeatModal(otherRoom.name)}
                    activeOpacity={0.7}>
                    <Text style={styles.addSeatSmallBtnText}>+ Add Seat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

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

      {/* Add Reading Room Modal */}
      <Modal
        visible={showAddRoomModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!creatingRoom) setShowAddRoomModal(false);
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.formSheet}>
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Add Reading Room</Text>
                <Text style={styles.sheetSub}>New Study Hall / Collaborative Space</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddRoomModal(false)}
                disabled={creatingRoom}
                style={styles.closeIconBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {addRoomError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {addRoomError}</Text>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>READING ROOM NAME *</Text>
              <TextInput
                style={styles.inputField}
                value={newRoomName}
                onChangeText={setNewRoomName}
                placeholder="e.g. Reading Room D"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.formTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>BUILDING / WING *</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newRoomBuilding}
                    onChangeText={setNewRoomBuilding}
                    placeholder="e.g. East Wing"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>FLOOR *</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newRoomFloor}
                    onChangeText={setNewRoomFloor}
                    placeholder="e.g. Floor 03"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>ZONE TYPE</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newRoomZone}
                    onChangeText={setNewRoomZone}
                    placeholder="e.g. Silent Study Zone"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>TOTAL CAPACITY *</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newRoomTotalSeats}
                    onChangeText={setNewRoomTotalSeats}
                    placeholder="e.g. 24"
                    keyboardType="number-pad"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>OPENING TIME (24H)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newRoomOpeningTime}
                    onChangeText={setNewRoomOpeningTime}
                    placeholder="08:00"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>CLOSING TIME (24H)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newRoomClosingTime}
                    onChangeText={setNewRoomClosingTime}
                    placeholder="18:30"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>DESCRIPTION / AMENITIES</Text>
              <TextInput
                style={[styles.inputField, { minHeight: 60 }]}
                value={newRoomDescription}
                onChangeText={setNewRoomDescription}
                placeholder="e.g. Individual desks with power outlets and high-speed Wi-Fi."
                placeholderTextColor="#94A3B8"
                multiline
              />

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleCreateRoom}
                disabled={creatingRoom}
                activeOpacity={0.8}>
                {creatingRoom ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionBtnText}>CREATE READING ROOM</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setShowAddRoomModal(false)}
                disabled={creatingRoom}>
                <Text style={styles.cancelActionBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add New Seat Modal */}
      <Modal
        visible={showAddSeatModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!addingSeat) setShowAddSeatModal(false);
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.formSheet}>
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Add Seat to Room</Text>
                <Text style={styles.sheetSub}>Desk Allocation & Numbering</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddSeatModal(false)}
                disabled={addingSeat}
                style={styles.closeIconBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {addSeatError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {addSeatError}</Text>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled">
              {/* Target Room Selector Chips */}
              <Text style={styles.fieldLabel}>TARGET READING ROOM *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.roomSelectChipsRow}>
                {rooms.map((rm) => {
                  const isMatch =
                    seatTargetRoom.toLowerCase() === rm.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={rm._id || rm.name}
                      style={[
                        styles.targetRoomChip,
                        isMatch && styles.activeTargetRoomChip,
                      ]}
                      onPress={() => {
                        setSeatTargetRoom(rm.name);
                        setNewSeatFloor(rm.floor || 'Floor 02');
                        setNewSeatWing(rm.wing || 'West Wing');
                      }}>
                      <Text
                        style={[
                          styles.targetRoomChipText,
                          isMatch && styles.activeTargetRoomChipText,
                        ]}>
                        {rm.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Seat Number */}
              <Text style={styles.fieldLabel}>SEAT NUMBER / CODE *</Text>
              <TextInput
                style={styles.inputField}
                value={newSeatNumber}
                onChangeText={setNewSeatNumber}
                placeholder="e.g. A06 or D04 or 25"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
              <Text style={styles.fieldHint}>
                Must be unique within {seatTargetRoom}.
              </Text>

              <View style={styles.formTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>FLOOR</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newSeatFloor}
                    onChangeText={setNewSeatFloor}
                    placeholder="Floor 02"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>WING / ZONE</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newSeatWing}
                    onChangeText={setNewSeatWing}
                    placeholder="West Wing"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Initial Status Selector */}
              <Text style={styles.fieldLabel}>INITIAL STATUS</Text>
              <View style={styles.statusOptionRow}>
                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    newSeatStatus === 'available' && styles.activeStatusChoiceBtn,
                  ]}
                  onPress={() => setNewSeatStatus('available')}>
                  <Text
                    style={[
                      styles.statusChoiceText,
                      newSeatStatus === 'available' && styles.activeStatusChoiceText,
                    ]}>
                    Available (Bookable)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusChoiceBtn,
                    newSeatStatus === 'maintenance' && styles.activeStatusChoiceBtn,
                  ]}
                  onPress={() => setNewSeatStatus('maintenance')}>
                  <Text
                    style={[
                      styles.statusChoiceText,
                      newSeatStatus === 'maintenance' && styles.activeStatusChoiceText,
                    ]}>
                    Maintenance
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleAddSeat}
                disabled={addingSeat}
                activeOpacity={0.8}>
                {addingSeat ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionBtnText}>SAVE SEAT TO ROOM</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setShowAddSeatModal(false)}
                disabled={addingSeat}>
                <Text style={styles.cancelActionBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
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
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addRoomBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addRoomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addSeatBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addSeatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  activeRoomChip: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  roomChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  activeRoomChipText: {
    color: '#FFFFFF',
  },
  chipBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeChipBadge: {
    backgroundColor: '#334155',
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activeChipBadgeText: {
    color: '#93C5FD',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addSeatInlineBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addSeatInlineBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  emptySeatsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptySeatsTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySeatsSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  addFirstSeatBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFirstSeatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  roomCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  viewMapBtn: {
    paddingVertical: 4,
  },
  viewMapBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  addSeatSmallBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addSeatSmallBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  formSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  formScrollContent: {
    paddingBottom: 28,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10,
  },
  fieldHint: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  formTwoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelActionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelActionBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  roomSelectChipsRow: {
    marginBottom: 8,
  },
  targetRoomChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  activeTargetRoomChip: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  targetRoomChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activeTargetRoomChipText: {
    color: '#FFFFFF',
  },
  statusOptionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  statusChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeStatusChoiceBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  activeStatusChoiceText: {
    color: '#FFFFFF',
  },
});
