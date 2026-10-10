import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M2Colors } from './m2-theme';

/** Light header for the Member 2 routes and student profile. */
export default function M2Header() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const notifications = pathname === '/notifications';
  const profile = pathname === '/profile';
  const seats = pathname.endsWith('/seats');
  const confirmation = pathname.endsWith('/confirmation');
  const details = pathname.startsWith('/reservations/');
  const reservationList = pathname === '/reservations';
  const showBack = notifications || profile || seats || details || reservationList;
  const title = profile ? 'My Profile' : notifications ? 'Notifications'
    : seats ? 'Select a Seat'
    : confirmation ? 'Confirmation'
    : details ? 'Reservation Details'
    : pathname === '/reservations' ? 'Seat Reservations' : 'Reading Rooms';
  const active = profile || notifications || pathname.startsWith('/reading-rooms') || pathname.startsWith('/reservations');

  const goBack = () => {
    // The list is also reached after booking; return to the hub rather than
    // reopening the confirmation or seat-selection flow.
    if (reservationList) router.replace('/my-reservations');
    else if (router.canGoBack()) router.back();
    else router.replace(profile || notifications ? '/home' : seats ? '/reading-rooms' : '/reservations');
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingLeft: Math.max(18, insets.left), paddingRight: Math.max(18, insets.right) }]}>
      {active && <StatusBar style="dark" />}
      <View style={styles.row}>
        {showBack && (
          <Pressable style={styles.iconButton} onPress={goBack} accessibilityRole="button" accessibilityLabel={reservationList ? 'Back to My Reservations' : 'Go back'}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={M2Colors.ink} size={23} />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
        <View style={styles.actions}>
          {!profile && <Pressable style={styles.iconButton} onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="My profile">
            <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} tintColor={M2Colors.blue} size={24} />
          </Pressable>}
          {!notifications && (
            <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')} accessibilityRole="button" accessibilityLabel="Notifications">
              <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} tintColor={M2Colors.blue} size={23} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: M2Colors.canvas },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: M2Colors.ink },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
});
