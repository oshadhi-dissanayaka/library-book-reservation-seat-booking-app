import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { staffTheme } from '../theme/staffTheme';
import { Reservation } from '../types/staff.types';
import { StatusBadge } from './StatusBadge';

interface StaffReservationCardProps {
  reservation: Reservation;
  onPress: () => void;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const StaffReservationCard: React.FC<StaffReservationCardProps> = ({
  reservation,
  onPress,
  onQuickAction,
  quickActionLabel,
}) => {
  const isBook = reservation.type === 'Book';
  const title = isBook
    ? reservation.bookTitle || 'Book Reservation'
    : `${reservation.room || 'Reading Room'} • ${reservation.seatNumber || 'Seat'}`;

  const detailInfo = isBook
    ? `${reservation.pickupDate || '—'} • ${reservation.pickupLocation || '—'}`
    : `${reservation.pickupDate || '—'} • ${reservation.timeSlot || '—'}`;

  const hasAlert = reservation.requiresAttention || reservation.status === 'EXCEPTION';

  return (
    <TouchableOpacity
      style={[styles.card, hasAlert && styles.alertBorder]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.topRow}>
        <View style={styles.idRow}>
          <Text style={styles.idText}>{reservation.reservationId}</Text>
          <View style={[styles.typeBadge, isBook ? styles.bookType : styles.seatType]}>
            <Text style={[styles.typeText, !isBook && styles.typeTextSeat]}>
              {reservation.type}
            </Text>
          </View>
        </View>
        <StatusBadge status={reservation.status} />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {reservation.bookAuthor ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {reservation.bookAuthor}
        </Text>
      ) : null}

      <View style={styles.studentRow}>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarMiniText}>
            {reservation.studentName ? reservation.studentName.charAt(0).toUpperCase() : 'S'}
          </Text>
        </View>
        <Text style={styles.studentName} numberOfLines={1}>
          {reservation.studentName}
        </Text>
        <Text style={styles.studentId}>({reservation.studentId})</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📅 {detailInfo}</Text>
      </View>

      {hasAlert && (
        <View style={styles.attentionBanner}>
          <Text style={styles.attentionIcon}>⚠️</Text>
          <Text style={styles.attentionText} numberOfLines={2}>
            {reservation.attentionReason || 'Requires staff verification & action'}
          </Text>
        </View>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.viewDetailsText}>Tap to view details →</Text>
        {onQuickAction && quickActionLabel && (
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              onQuickAction();
            }}
            activeOpacity={0.7}>
            <Text style={styles.quickActionText}>{quickActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: staffTheme.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staffTheme.line,
    shadowColor: staffTheme.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  alertBorder: {
    borderColor: staffTheme.redLine,
    borderLeftWidth: 4,
    borderLeftColor: staffTheme.red,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idText: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  bookType: {
    backgroundColor: staffTheme.paleBlue,
    borderColor: staffTheme.navyTint,
  },
  seatType: {
    backgroundColor: staffTheme.paleAmber,
    borderColor: staffTheme.amberLine,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: staffTheme.blue,
  },
  typeTextSeat: {
    color: staffTheme.amber,
  },
  title: {
    color: staffTheme.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: staffTheme.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: staffTheme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: staffTheme.ink,
  },
  studentName: {
    color: staffTheme.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  studentId: {
    color: staffTheme.muted,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    color: staffTheme.muted,
    fontSize: 12,
  },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staffTheme.paleRed,
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: staffTheme.redLine,
    marginBottom: 10,
    gap: 6,
  },
  attentionIcon: {
    fontSize: 14,
  },
  attentionText: {
    color: staffTheme.red,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: staffTheme.canvas,
    paddingTop: 10,
    marginTop: 2,
  },
  viewDetailsText: {
    color: staffTheme.navy,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionButton: {
    backgroundColor: staffTheme.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickActionText: {
    color: staffTheme.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
