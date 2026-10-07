import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const normStatus = (status || '').toUpperCase();

  let bg = '#E2E8F0';
  let borderColor = '#CBD5E1';
  let textColor = '#334155';
  let label = status;

  switch (normStatus) {
    case 'CONFIRMED':
      bg = '#DCFCE7';
      borderColor = '#86EFAC';
      textColor = '#15803D';
      label = 'CONFIRMED';
      break;
    case 'READY_FOR_PICKUP':
      bg = '#DBEAFE';
      borderColor = '#93C5FD';
      textColor = '#1D4ED8';
      label = 'READY FOR PICKUP';
      break;
    case 'EXCEPTION':
      bg = '#FEE2E2';
      borderColor = '#FCA5A5';
      textColor = '#B91C1C';
      label = 'EXCEPTION';
      break;
    case 'NO_SHOW':
    case 'NO-SHOW':
      bg = '#FEF3C7';
      borderColor = '#FCD34D';
      textColor = '#B45309';
      label = 'NO-SHOW';
      break;
    case 'CANCELLED':
      bg = '#F1F5F9';
      borderColor = '#CBD5E1';
      textColor = '#64748B';
      label = 'CANCELLED';
      break;
    case 'REJECTED':
      bg = '#FEE2E2';
      borderColor = '#FCA5A5';
      textColor = '#DC2626';
      label = 'REJECTED';
      break;
    case 'AVAILABLE':
      bg = '#DCFCE7';
      borderColor = '#86EFAC';
      textColor = '#166534';
      label = 'Available';
      break;
    case 'UNAVAILABLE':
      bg = '#FEE2E2';
      borderColor = '#FCA5A5';
      textColor = '#991B1B';
      label = 'Unavailable';
      break;
    case 'UNDER MAINTENANCE':
    case 'IN REPAIR':
      bg = '#FEF3C7';
      borderColor = '#FCD34D';
      textColor = '#92400E';
      label = 'Maintenance';
      break;
    default:
      bg = '#F1F5F9';
      borderColor = '#E2E8F0';
      textColor = '#475569';
      label = status;
  }

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}>
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 11,
  },
  textMedium: {
    fontSize: 12,
  },
});
