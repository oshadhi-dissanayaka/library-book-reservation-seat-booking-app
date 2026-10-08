import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Library Guide & Policies</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Essential guidelines for book reservations,{'\n'}study seat bookings, and circulation services.
          </ThemedText>

          <ExternalLink href="https://library.university.edu" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">Institutional Library Portal</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="Book Borrowing & Reservation Policy">
            <ThemedText type="small">
              • Standard undergraduate loan duration is 14 days per item.
            </ThemedText>
            <ThemedText type="small">
              • Reserved copies are prepared at Circulation Desk 01 and held for 24 hours after reservation confirmation.
            </ThemedText>
            <ThemedText type="small">
              • Renewals may be requested via the portal if no hold requests are placed by other readers.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Reading-Room Seat Booking Guidelines">
            <ThemedText type="small">
              • Study room bookings operate on designated 2-hour and 4-hour quiet study slots.
            </ThemedText>
            <ThemedText type="small">
              • A 15-minute grace period applies from the booking start time. Unclaimed seats are automatically released for other students.
            </ThemedText>
            <ThemedText type="small">
              • Please maintain quiet study etiquette and ensure mobile devices remain in silent mode.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Operating Hours & Service Schedules">
            <ThemedText type="small">
              • Monday – Friday: 08:00 AM – 20:00 PM
            </ThemedText>
            <ThemedText type="small">
              • Saturday – Sunday: 09:00 AM – 17:00 PM
            </ThemedText>
            <ThemedText type="small">
              • Circulation Desk transactions close 30 minutes before official library closing time.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Circulation Desk & Helpdesk Support">
            <ThemedText type="small">
              • Circulation Desk 01 is located on the Ground Floor Main Hall for in-person pickups and returns.
            </ThemedText>
            <ThemedText type="small">
              • For catalog inquiries, inter-library loan requests, or account assistance, visit the desk or contact circulation-desk@university.edu.
            </ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
