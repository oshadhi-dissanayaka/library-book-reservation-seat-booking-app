import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    ? `${reservation.pickupDate || 'Today'} • ${reservation.pickupLocation || 'Desk 01'}`
    : `${reservation.pickupDate || 'Today'} • ${reservation.timeSlot || '10:00 AM - 12:00 PM'}`;

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
            <Text style={styles.typeText}>{reservation.type}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  alertBorder: {
    borderColor: '#FCA5A5',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
    color: '#0F172A',
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
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  seatType: {
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#64748B',
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
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  studentName: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  studentId: {
    color: '#64748B',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
  },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 10,
    gap: 6,
  },
  attentionIcon: {
    fontSize: 14,
  },
  attentionText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  viewDetailsText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
