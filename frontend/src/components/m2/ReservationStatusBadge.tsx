import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { M2Colors, M2Radii } from './m2-theme';

type Status = 'active' | 'cancelled' | 'completed' | 'expired' | string;

interface Props {
  status: Status;
}

function labelFor(status: Status): string {
  if (status === 'active') return 'Active';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'completed') return 'Completed';
  if (status === 'expired') return 'Expired';
  // capitalise unknown statuses
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ReservationStatusBadge({ status }: Props) {
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed' || status === 'expired';

  const badgeBg = isCancelled
    ? M2Colors.paleRed
    : isCompleted
      ? '#F0F1F5'
      : M2Colors.paleGreen;

  const badgeText = isCancelled
    ? M2Colors.red
    : isCompleted
      ? M2Colors.muted
      : M2Colors.green;

  return (
    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
      <View style={[styles.dot, { backgroundColor: badgeText }]} />
      <Text style={[styles.label, { color: badgeText }]}>
        {labelFor(status).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: M2Radii.badge,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
