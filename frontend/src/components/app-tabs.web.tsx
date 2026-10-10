import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { NotificationButton } from './notification-button';
import { RoleGatewayButton } from './role-gateway-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <ThemedView style={styles.header}>
        <RoleGatewayButton />
        <NotificationButton />
      </ThemedView>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="books" href="/books" asChild>
            <TabButton>Books</TabButton>
          </TabTrigger>
          <TabTrigger name="reading-rooms" href="/reading-rooms" asChild>
            <TabButton>Seats</TabButton>
          </TabTrigger>
          <TabTrigger name="my-reservations" href="/my-reservations" asChild>
            <TabButton>Reservations</TabButton>
          </TabTrigger>
          <TabTrigger name="notifications" href="/notifications" style={styles.hiddenRoute} />
          <TabTrigger name="explore" href="/explore" style={styles.hiddenRoute} />
          <TabTrigger name="reservations" href="/reservations" style={styles.hiddenRoute} />
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          LibConnect
        </ThemedText>

        {props.children}

      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E1E6',
  },
  tabSlot: {
    flex: 1,
  },
  hiddenRoute: {
    display: 'none',
  },
  tabListContainer: {
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
