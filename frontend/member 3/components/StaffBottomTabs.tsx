import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type StaffTabName = 'dashboard' | 'reservations' | 'books' | 'room';

interface StaffBottomTabsProps {
  currentTab: StaffTabName;
  onSelectTab: (tab: StaffTabName) => void;
  badgeCounts?: {
    reservations?: number;
    exceptions?: number;
  };
}

export const StaffBottomTabs: React.FC<StaffBottomTabsProps> = ({
  currentTab,
  onSelectTab,
  badgeCounts,
}) => {
  const tabs: { key: StaffTabName; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'reservations', label: 'Reservations', icon: '📋' },
    { key: 'books', label: 'Books', icon: '📚' },
    { key: 'room', label: 'Room', icon: '🏛️' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}>
            <View style={styles.iconContainer}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              {tab.key === 'reservations' && (badgeCounts?.exceptions || 0) > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{badgeCounts?.exceptions}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 64,
  },
  activeTabButton: {
    backgroundColor: '#EFF6FF',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  tabIcon: {
    fontSize: 20,
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#2563EB',
    fontWeight: '800',
  },
});
