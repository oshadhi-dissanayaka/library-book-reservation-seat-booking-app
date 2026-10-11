import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { clearAuthSession } from '@/lib/auth-session';

export type ManagementTab = 'overview' | 'usage' | 'reservations' | 'seats' | 'staff';

interface ManagementBottomBarProps {
  currentTab: ManagementTab;
}

export function ManagementBottomBar({ currentTab }: ManagementBottomBarProps) {
  const tabs: {
    id: ManagementTab;
    label: string;
    route: Href;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      route: '/management/library-overview',
      iconActive: 'bar-chart',
      iconInactive: 'bar-chart-outline',
    },
    {
      id: 'usage',
      label: 'Usage',
      route: '/management/book-usage',
      iconActive: 'book',
      iconInactive: 'book-outline',
    },
    {
      id: 'reservations',
      label: 'Reservations',
      route: '/management/reservation-analytics',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
    },
    {
      id: 'seats',
      label: 'Seats',
      route: '/management/seat-occupancy',
      iconActive: 'desktop',
      iconInactive: 'desktop-outline',
    },
    
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row border-t border-slate-100 bg-white px-2 pb-6 pt-3 shadow-sm">
      <Pressable
        onPress={() => {
          // Signing out of the management portal clears the stored session so
          // the next launch lands on the role-selection gateway again.
          void clearAuthSession().then(() => router.replace('/portal'));
        }}
        accessibilityRole="button"
        accessibilityLabel="Sign out and return to the portal"
        className="items-center justify-center px-2 py-1">
        <Ionicons name="arrow-back" size={22} color="#64748B" />
        <Text className="mt-1 text-[11px] text-slate-500">Portal</Text>
      </Pressable>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const iconName = isActive ? tab.iconActive : tab.iconInactive;
        const color = isActive ? '#1E3A8A' : '#64748B';

        return (
          <Pressable
            key={tab.id}
            onPress={() => {
              if (!isActive) {
                router.replace(tab.route);
              }
            }}
            className="flex-1 items-center justify-center py-1"
          >
            <Ionicons name={iconName} size={22} color={color} />
            <Text
              className={`mt-1 text-[11px] ${
                isActive ? 'font-bold text-blue-950' : 'font-normal text-slate-500'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
