import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export function NotificationButton() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.backgroundElement },
        pressed && styles.pressed,
      ]}
      onPress={() => router.push('/notifications')}>
      <SymbolView
        name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
        tintColor={colors.text}
        size={23}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
