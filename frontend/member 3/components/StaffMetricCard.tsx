import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StaffMetricCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  alert?: boolean;
  badgeText?: string;
  onPress?: () => void;
  accentColor?: string;
}

export const StaffMetricCard: React.FC<StaffMetricCardProps> = ({
  label,
  value,
  highlight = false,
  alert = false,
  badgeText,
  onPress,
  accentColor,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        highlight && styles.highlightCard,
        alert && styles.alertCard,
        accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : undefined,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, alert && styles.alertLabel]}>{label}</Text>
        {alert && (
          <View style={styles.alertPill}>
            <Text style={styles.alertPillText}>!</Text>
          </View>
        )}
        {badgeText && !alert && (
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{badgeText}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, alert && styles.alertValue]}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  alertCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  alertLabel: {
    color: '#991B1B',
  },
  value: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  alertValue: {
    color: '#DC2626',
  },
  alertPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  badgePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
});
