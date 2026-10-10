import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image, useColorScheme } from 'react-native';

import { NotificationButton } from '@/components/notification-button';
import M2Header from '@/components/m2/M2Header';
import { RoleGatewayButton } from '@/components/role-gateway-button';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerRight: () => <NotificationButton />,
        headerLeft: () => <RoleGatewayButton />,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarLabelStyle: { fontSize: 10 },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/home.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="books"
        options={{
          title: 'Books',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'book', android: 'menu_book', web: 'menu_book' }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reading-rooms"
        options={{
          title: 'Seats',
          header: () => <M2Header />,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'chair.lounge', android: 'event_seat', web: 'event_seat' }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="my-reservations"
        options={{
          title: 'Reservations',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      {/* Notifications stays registered but is reached via the header bell. */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          header: () => <M2Header />,
          href: null,
          tabBarIcon: ({ color, size }) => (
            <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null, title: 'Book Reservations' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'My Profile', header: () => <M2Header /> }} />
      <Tabs.Screen name="reservations" options={{ href: null, title: 'Seat Reservations', header: () => <M2Header /> }} />
    </Tabs>
  );
}
