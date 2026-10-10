import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ConfirmationModal } from '../components/ConfirmationModal';
import { StaffHeader } from '../components/StaffHeader';
import { staffApi } from '../services/staffApi';
import { staffTheme } from '../theme/staffTheme';
import { Reservation } from '../types/staff.types';

interface RejectCancelReservationScreenProps {
  reservation: Reservation;
  onBack: () => void;
  onRejectionSuccess: (rejectedReservation: Reservation) => void;
  staffId?: string;
}

const REJECTION_REASONS = [
  'Book unavailable',
  'Book damaged / under repair',
  'Library maintenance',
  'Duplicate or invalid reservation',
  'Desk policy violation',
];

export const RejectCancelReservationScreen: React.FC<
  RejectCancelReservationScreenProps
> = ({
  reservation,
  onBack,
  onRejectionSuccess,
  staffId = 'STF-4092',
}) => {
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[1]); // Default: Book damaged / under repair
  const [explanation, setExplanation] = useState(
    'Water-damage detected along spine block; sent to restoration.'
  );
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInitiateReject = () => {
    if (!selectedReason) {
      setError('Please select an official rejection reason.');
      return;
    }
    setError('');
    setConfirmModalVisible(true);
  };

  const handleConfirmReject = async () => {
    setLoading(true);
    try {
      const res = await staffApi.rejectReservation(
        reservation.reservationId,
        selectedReason,
        explanation
      );
      if (res.success) {
        setConfirmModalVisible(false);
        onRejectionSuccess(res.data);
      } else {
        Alert.alert('Error', res.message || 'Failed to reject reservation.');
      }
    } catch {
      Alert.alert('Error', 'Unable to complete rejection request.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    reservation.type === 'Book'
      ? reservation.bookTitle || 'Book Reservation'
      : `${reservation.room} • Seat ${reservation.seatNumber}`;

  return (
    <View style={styles.container}>
      <StaffHeader
        title="Reject Reservation"
        subtitle={`Action for ${reservation.reservationId}`}
        onBack={onBack}
        showBack={true}
        staffId={staffId}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Item Target Card */}
          <View style={styles.targetCard}>
            <View style={styles.targetIdRow}>
              <Text style={styles.targetId}>{reservation.reservationId}</Text>
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{reservation.type}</Text>
              </View>
            </View>
            <Text style={styles.targetTitle}>{title}</Text>
            <Text style={styles.targetStudent}>
              Student: {reservation.studentName} ({reservation.studentId})
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Reason Selection */}
          <Text style={styles.sectionLabel}>OFFICIAL REJECTION REASON *</Text>
          <View style={styles.reasonsList}>
            {REJECTION_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonOption, isSelected && styles.selectedReasonOption]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}>
                  <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.reasonText, isSelected && styles.selectedReasonText]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation Textarea */}
          <Text style={styles.sectionLabel}>EXPLANATION FOR STUDENT / AUDIT</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              value={explanation}
              onChangeText={setExplanation}
              multiline
              numberOfLines={4}
              placeholder="Enter explanation to be logged and sent to student..."
              placeholderTextColor={staffTheme.placeholder}
              textAlignVertical="top"
            />
          </View>

          {/* Student Notification Notice */}
          <View style={styles.notificationAlert}>
            <Text style={styles.alertIcon}>📢</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertHeading}>Student will be notified</Text>
              <Text style={styles.alertBody}>
                Automated push notification & campus SMS will be dispatched to student ID{' '}
                {reservation.studentId} with this explanation.
              </Text>
            </View>
          </View>

          {/* Reject Action Button */}
          <TouchableOpacity
            style={styles.rejectSubmitButton}
            onPress={handleInitiateReject}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={staffTheme.white} />
            ) : (
              <Text style={styles.rejectSubmitText}>REJECT RESERVATION</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={onBack}
            disabled={loading}
            activeOpacity={0.7}>
            <Text style={styles.cancelLinkText}>Keep Reservation (Back)</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModalVisible}
        title="Confirm Reservation Rejection?"
        message={`Are you sure you want to reject reservation ${reservation.reservationId} for ${reservation.studentName}? This action cannot be undone.`}
        confirmLabel="Confirm Rejection"
        cancelLabel="Go Back"
        isDestructive={true}
        isLoading={loading}
        onConfirm={handleConfirmReject}
        onCancel={() => setConfirmModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staffTheme.canvas,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  targetCard: {
    backgroundColor: staffTheme.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: staffTheme.line,
  },
  targetIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  targetId: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  typeTag: {
    backgroundColor: staffTheme.paleBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    color: staffTheme.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  targetTitle: {
    color: staffTheme.ink,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  targetStudent: {
    color: staffTheme.muted,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: staffTheme.paleRed,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: staffTheme.red,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staffTheme.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: staffTheme.line,
    gap: 12,
  },
  selectedReasonOption: {
    borderColor: staffTheme.red,
    backgroundColor: staffTheme.paleRed,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: staffTheme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: staffTheme.red,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: staffTheme.red,
  },
  reasonText: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  selectedReasonText: {
    color: staffTheme.red,
    fontWeight: '700',
  },
  textAreaContainer: {
    backgroundColor: staffTheme.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: staffTheme.line,
    padding: 12,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 14,
    color: staffTheme.ink,
    minHeight: 80,
  },
  notificationAlert: {
    flexDirection: 'row',
    backgroundColor: staffTheme.paleBlue,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: staffTheme.navyTint,
    gap: 10,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertHeading: {
    color: staffTheme.navy,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertBody: {
    color: staffTheme.blue,
    fontSize: 12,
    lineHeight: 16,
  },
  rejectSubmitButton: {
    backgroundColor: staffTheme.red,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: staffTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectSubmitText: {
    color: staffTheme.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelLinkText: {
    color: staffTheme.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
