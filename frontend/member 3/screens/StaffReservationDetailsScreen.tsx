import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ConfirmationModal } from '../components/ConfirmationModal';
import { StaffHeader } from '../components/StaffHeader';
import { StatusBadge } from '../components/StatusBadge';
import { staffApi } from '../services/staffApi';
import { staffTheme } from '../theme/staffTheme';
import { Reservation, ReservationStatus } from '../types/staff.types';

interface StaffReservationDetailsScreenProps {
  reservation: Reservation;
  onBack: () => void;
  onNavigateReject: (reservation: Reservation) => void;
  onStatusUpdated?: (updated: Reservation) => void;
  staffId?: string;
}

export const StaffReservationDetailsScreen: React.FC<
  StaffReservationDetailsScreenProps
> = ({
  reservation: initialReservation,
  onBack,
  onNavigateReject,
  onStatusUpdated,
  staffId = 'STF-4092',
}) => {
  const [reservation, setReservation] = useState<Reservation>(initialReservation);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [confirmNoShowVisible, setConfirmNoShowVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const isBook = reservation.type === 'Book';

  const handleUpdateStatus = async (newStatus: ReservationStatus) => {
    setLoading(true);
    setStatusModalVisible(false);
    try {
      const res = await staffApi.updateReservationStatus(
        reservation.reservationId,
        newStatus,
        `Status updated by ${staffId} on ${new Date().toLocaleDateString()}`
      );
      if (res.success) {
        setReservation(res.data);
        if (onStatusUpdated) onStatusUpdated(res.data);
        setFeedbackMessage(`Status updated to ${newStatus}`);
        setTimeout(() => setFeedbackMessage(''), 3500);
      } else {
        Alert.alert('Update failed', res.message || 'Failed to update reservation status.');
      }
    } catch {
      Alert.alert('Error', 'Failed to update reservation status.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNoShow = async () => {
    setLoading(true);
    setConfirmNoShowVisible(false);
    try {
      const res = await staffApi.markNoShow(reservation.reservationId);
      if (res.success) {
        setReservation(res.data);
        if (onStatusUpdated) onStatusUpdated(res.data);
        setFeedbackMessage(`Reservation marked as NO-SHOW. Resource released.`);
        setTimeout(() => setFeedbackMessage(''), 4000);
      } else {
        Alert.alert('No-show failed', res.message || 'Failed to record no-show.');
      }
    } catch {
      Alert.alert('Error', 'Failed to record no-show.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StaffHeader
        title="Reservation Details"
        subtitle={`ID: ${reservation.reservationId}`}
        onBack={onBack}
        showBack={true}
        staffId={staffId}
      />

      {feedbackMessage ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>✓ {feedbackMessage}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Resource Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>{reservation.reservationId}</Text>
            </View>
            <StatusBadge status={reservation.status} size="medium" />
          </View>

          <Text style={styles.mainTitle}>
            {isBook ? reservation.bookTitle || 'Book Reservation' : `${reservation.room} • Seat ${reservation.seatNumber}`}
          </Text>

          {reservation.bookSubtitle ? (
            <Text style={styles.subtitle}>{reservation.bookSubtitle}</Text>
          ) : null}

          {isBook && reservation.bookAuthor ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Author:</Text>
              <Text style={styles.detailValue}>{reservation.bookAuthor}</Text>
            </View>
          ) : null}

          {isBook && reservation.bookEdition ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Edition:</Text>
              <Text style={styles.detailValue}>{reservation.bookEdition}</Text>
            </View>
          ) : null}

          {isBook && reservation.bookShelf ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shelf Location:</Text>
              <Text style={[styles.detailValue, styles.shelfHighlight]}>
                📍 {reservation.bookShelf}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Student Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>STUDENT INFORMATION</Text>
          <View style={styles.studentInfoBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {reservation.studentName ? reservation.studentName.charAt(0) : 'S'}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{reservation.studentName}</Text>
              <Text style={styles.studentId}>Student ID: {reservation.studentId}</Text>
              <Text style={styles.studentProg}>
                {reservation.studentProgram || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Reservation Logistics Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>LOGISTICS & TIMELINE</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Reservation Type</Text>
              <Text style={styles.gridValue}>{reservation.type}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Pickup Date</Text>
              <Text style={styles.gridValue}>{reservation.pickupDate || '—'}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Location</Text>
              <Text style={styles.gridValue}>
                {reservation.pickupLocation || '—'}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Duration / Slot</Text>
              <Text style={styles.gridValue}>
                {isBook ? reservation.loanDuration || '—' : reservation.timeSlot || '—'}
              </Text>
            </View>
          </View>

          {reservation.deskNote ? (
            <View style={styles.deskNoteBox}>
              <Text style={styles.deskNoteLabel}>Circulation Desk Note:</Text>
              <Text style={styles.deskNoteText}>{reservation.deskNote}</Text>
            </View>
          ) : null}
        </View>

        {/* Policy Notice Box */}
        <View style={styles.policyCard}>
          <Text style={styles.policyIcon}>ℹ️</Text>
          <Text style={styles.policyText}>
            Hold for pickup until 18:00 hrs. Mark as No-show if uncollected to release item back to circulation.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.updateStatusButton}
            onPress={() => setStatusModalVisible(true)}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={staffTheme.white} />
            ) : (
              <Text style={styles.updateStatusText}>UPDATE STATUS</Text>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onNavigateReject(reservation)}
              activeOpacity={0.8}>
              <Text style={styles.rejectButtonText}>CANCEL / REJECT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.noShowButton}
              onPress={() => setConfirmNoShowVisible(true)}
              activeOpacity={0.8}>
              <Text style={styles.noShowButtonText}>MARK NO-SHOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Status Selection Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.statusSheet}>
            <Text style={styles.sheetTitle}>Select Reservation Status</Text>
            <Text style={styles.sheetSub}>Update circulation queue for {reservation.reservationId}</Text>

            {[
              { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup (At Circulation Desk)', color: staffTheme.navy },
              { status: 'CONFIRMED', label: 'Confirmed (Standard Hold)', color: staffTheme.green },
              { status: 'COMPLETED', label: 'Completed (Book Issued / Seat Checked In)', color: staffTheme.muted },
              { status: 'EXCEPTION', label: 'Exception (Hold for Review)', color: staffTheme.red },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.status}
                style={styles.sheetOption}
                onPress={() => handleUpdateStatus(opt.status as ReservationStatus)}>
                <View style={[styles.statusOptionDot, { backgroundColor: opt.color }]} />
                <Text style={styles.sheetOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No-show Confirmation Modal */}
      <ConfirmationModal
        visible={confirmNoShowVisible}
        title="Mark Reservation as No-show?"
        message={`Are you sure you want to mark ${reservation.reservationId} (${reservation.studentName}) as No-show? The reserved resource will be freed immediately.`}
        confirmLabel="Mark No-show"
        isDestructive={true}
        isLoading={loading}
        onConfirm={handleMarkNoShow}
        onCancel={() => setConfirmNoShowVisible(false)}
      />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: staffTheme.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: staffTheme.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  idBadge: {
    backgroundColor: staffTheme.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idBadgeText: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  mainTitle: {
    color: staffTheme.ink,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: staffTheme.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  detailLabel: {
    color: staffTheme.muted,
    fontSize: 13,
    fontWeight: '600',
    width: 110,
  },
  detailValue: {
    color: staffTheme.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  shelfHighlight: {
    color: staffTheme.navy,
    fontWeight: '700',
  },
  sectionHeader: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  studentInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staffTheme.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: staffTheme.blue,
    fontSize: 18,
    fontWeight: '800',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    color: staffTheme.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  studentId: {
    color: staffTheme.muted,
    fontSize: 13,
    marginTop: 2,
  },
  studentProg: {
    color: staffTheme.muted,
    fontSize: 11,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    color: staffTheme.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  deskNoteBox: {
    backgroundColor: staffTheme.canvas,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: staffTheme.line,
  },
  deskNoteLabel: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  deskNoteText: {
    color: staffTheme.ink,
    fontSize: 12,
  },
  policyCard: {
    flexDirection: 'row',
    backgroundColor: staffTheme.paleAmber,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  policyIcon: {
    fontSize: 18,
  },
  policyText: {
    color: staffTheme.amberDeep,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  actionContainer: {
    gap: 12,
  },
  updateStatusButton: {
    backgroundColor: staffTheme.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: staffTheme.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  updateStatusText: {
    color: staffTheme.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: staffTheme.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: staffTheme.red,
  },
  rejectButtonText: {
    color: staffTheme.red,
    fontSize: 13,
    fontWeight: '700',
  },
  noShowButton: {
    flex: 1,
    backgroundColor: staffTheme.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: staffTheme.amber,
  },
  noShowButtonText: {
    color: staffTheme.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  statusSheet: {
    backgroundColor: staffTheme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetTitle: {
    color: staffTheme.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    color: staffTheme.muted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: staffTheme.canvas,
    gap: 12,
  },
  statusOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sheetOptionText: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sheetCancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: staffTheme.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
