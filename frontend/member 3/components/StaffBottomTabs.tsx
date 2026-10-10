import { SymbolView } from 'expo-symbols';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { staffTheme } from '../theme/staffTheme';

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
  const tabs: {
    key: StaffTabName;
    label: string;
    name: React.ComponentProps<typeof SymbolView>['name'];
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      name: { ios: 'chart.bar', android: 'assessment', web: 'assessment' },
    },
    {
      key: 'reservations',
      label: 'Reservations',
      name: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    },
    {
      key: 'books',
      label: 'Books',
      name: { ios: 'book.closed', android: 'menu_book', web: 'menu_book' },
    },
    {
      key: 'room',
      label: 'Room',
      name: { ios: 'building.2', android: 'account_balance', web: 'account_balance' },
    },
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
              <SymbolView
                name={tab.name}
                tintColor={isActive ? staffTheme.navy : staffTheme.muted}
                size={20}
              />
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
    backgroundColor: staffTheme.white,
    borderTopWidth: 1,
    borderTopColor: staffTheme.line,
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
    backgroundColor: staffTheme.paleBlue,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
    height: 24,
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: staffTheme.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: staffTheme.white,
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: staffTheme.muted,
  },
  activeTabLabel: {
    color: staffTheme.navy,
    fontWeight: '800',
  },
});
