import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { staffTheme } from '../theme/staffTheme';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const normStatus = (status || '').toUpperCase();

  let bg: string = staffTheme.canvas;
  let borderColor: string = staffTheme.line;
  let textColor: string = staffTheme.muted;
  let label = status;

  switch (normStatus) {
    case 'CONFIRMED':
      bg = staffTheme.paleGreen;
      borderColor = staffTheme.greenLine;
      textColor = staffTheme.green;
      label = 'CONFIRMED';
      break;
    case 'READY_FOR_PICKUP':
      bg = staffTheme.paleBlue;
      borderColor = staffTheme.navyTint;
      textColor = staffTheme.blue;
      label = 'READY FOR PICKUP';
      break;
    case 'EXCEPTION':
      bg = staffTheme.paleRed;
      borderColor = staffTheme.redLine;
      textColor = staffTheme.red;
      label = 'EXCEPTION';
      break;
    case 'NO_SHOW':
    case 'NO-SHOW':
      bg = staffTheme.paleAmber;
      borderColor = staffTheme.amberLine;
      textColor = staffTheme.amber;
      label = 'NO-SHOW';
      break;
    case 'CANCELLED':
      bg = staffTheme.canvas;
      borderColor = staffTheme.line;
      textColor = staffTheme.muted;
      label = 'CANCELLED';
      break;
    case 'REJECTED':
      bg = staffTheme.paleRed;
      borderColor = staffTheme.redLine;
      textColor = staffTheme.red;
      label = 'REJECTED';
      break;
    case 'AVAILABLE':
      bg = staffTheme.paleGreen;
      borderColor = staffTheme.greenLine;
      textColor = staffTheme.green;
      label = 'Available';
      break;
    case 'UNAVAILABLE':
      bg = staffTheme.paleRed;
      borderColor = staffTheme.redLine;
      textColor = staffTheme.red;
      label = 'Unavailable';
      break;
    case 'UNDER MAINTENANCE':
    case 'IN REPAIR':
      bg = staffTheme.paleAmber;
      borderColor = staffTheme.amberLine;
      textColor = staffTheme.amberDeep;
      label = 'Maintenance';
      break;
    default:
      bg = staffTheme.canvas;
      borderColor = staffTheme.line;
      textColor = staffTheme.muted;
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
