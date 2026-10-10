import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/brand';

/**
 * The LibConnect logo mark used on the launch/onboarding/portal/home
 * screens: a rounded badge with a book symbol, matching the badge style
 * already used by the Books screen brand row and the Staff login.
 */
export function LibConnectMark({ size = 72 }: { size?: number }) {
  const radius = Math.round(size * 0.28);
  return (
    <View
      accessibilityLabel="LibConnect logo"
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radius },
      ]}>
      <SymbolView
        name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
        tintColor={Brand.white}
        size={Math.round(size * 0.5)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
});
