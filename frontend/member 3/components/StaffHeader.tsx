import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StaffHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  staffId?: string;
  desk?: string;
  showBack?: boolean;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  title,
  subtitle = 'Staff Operations',
  onBack,
  staffId = 'STF-4092',
  desk = 'Circulation Desk 01',
  showBack = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            <View style={styles.portalPill}>
              <Text style={styles.portalPillText}>LIBRARY STAFF</Text>
            </View>
            <Text style={styles.deskText}>{desk}</Text>
          </View>
        )}

        <View style={styles.userBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.userIdText}>{staffId}</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portalPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  portalPillText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  deskText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  backButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  userIdText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  titleRow: {
    marginTop: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
});
