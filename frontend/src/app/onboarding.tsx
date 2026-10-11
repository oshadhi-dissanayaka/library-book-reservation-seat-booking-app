import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LibConnectMark } from '@/components/libconnect-mark';
import { Brand } from '@/constants/brand';
import { setOnboardingComplete } from '@/lib/portal-session';

/**
 * SCREEN B/C — Onboarding flow (route "/onboarding").
 *
 * Three swipeable/tappable pages:
 *   1. Brand welcome   — LibConnect, University Library Services
 *   2. Introduction    — "Your digital gateway…" + Get Started
 *   3. Services        — Books / Reading-Room Seats / GET STARTED
 *
 * Finishing (or skipping) persists libconnect_onboarding_complete and
 * continues to /portal (Student / Academic Staff login entry).
 * Simple horizontal paging + fade only — no animation framework.
 */

const SCREEN_WIDTH = Dimensions.get('window').width;
const PAGE_COUNT = 3;

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  // Lazy useState (not useRef().current) — refs must not be read during render.
  const [buttonFade] = useState(() => new Animated.Value(1));

  const finish = async () => {
    Animated.timing(buttonFade, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      void setOnboardingComplete().then(() => router.replace('/portal'));
    });
  };

  const goToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setPage(index);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const clamped = Math.min(PAGE_COUNT - 1, Math.max(0, index));
    setPage(clamped);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.skipRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={8}
            onPress={() => void finish()}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.pager}>
          {/* Page 1 — Brand welcome (SCREEN B) */}
          <View style={styles.page}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>UNIVERSITY LIBRARY SERVICES</Text>
            </View>
            <LibConnectMark size={96} />
            <Text style={styles.brandTitle}>LibConnect</Text>
            <Text style={styles.brandTagline}>CONNECT · RESERVE · STUDY</Text>
            <View style={styles.footerNote}>
              <SymbolView
                name={{ ios: 'building.columns', android: 'account_balance', web: 'account_balance' }}
                tintColor="#a9c2ef"
                size={16}
              />
              <Text style={styles.footerNoteText}>University Library Information System</Text>
            </View>
          </View>

          {/* Page 2 — Introduction + Get Started (SCREEN B) */}
          <View style={styles.page}>
            <LibConnectMark size={72} />
            <Text style={styles.introTitle}>
              Your digital gateway to university books, archives, and reading-room seats.
            </Text>
            <Text style={styles.introCopy}>
              Search the catalog, reserve a copy for pickup, and book a study desk in the
              reading rooms — all in one place.
            </Text>
            <Animated.View style={[styles.buttonWrap, { opacity: buttonFade }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => goToPage(2)}
                style={({ pressed }) => [styles.whiteButton, pressed && styles.pressed]}>
                <Text style={styles.whiteButtonText}>Get Started →</Text>
              </Pressable>
            </Animated.View>
            <Text style={styles.accessFooter}>Institutional access · University members only</Text>
          </View>

          {/* Page 3 — Services overview (SCREEN C) */}
          <View style={styles.page}>
            <View style={styles.heroBanner}>
              <SymbolView
                name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                tintColor="#ffffff"
                size={40}
              />
            </View>
            <View style={styles.heroOverlap}>
              <LibConnectMark size={64} />
            </View>
            <Text style={styles.servicesTitle}>LibConnect Services</Text>
            <Text style={styles.servicesSubtitle}>CONNECT · RESERVE · STUDY</Text>

            <View style={styles.featureCard}>
              <SymbolView
                name={{ ios: 'book', android: 'menu_book', web: 'menu_book' }}
                tintColor={Brand.blue}
                size={22}
              />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Book Reservation</Text>
                <Text style={styles.featureCopy}>Search the catalog and reserve a copy for pickup.</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <SymbolView
                name={{ ios: 'chair.lounge', android: 'event_seat', web: 'event_seat' }}
                tintColor={Brand.blue}
                size={22}
              />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Reading-Room Seats</Text>
                <Text style={styles.featureCopy}>Check availability and book a study desk.</Text>
              </View>
            </View>

            <Animated.View style={[styles.buttonWrap, { opacity: buttonFade }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void finish()}
                style={({ pressed }) => [styles.blueButton, pressed && styles.pressed]}>
                <Text style={styles.blueButtonText}>GET STARTED →</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>

        <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${PAGE_COUNT}`}>
          {Array.from({ length: PAGE_COUNT }, (_, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Go to page ${index + 1}`}
              onPress={() => goToPage(index)}
              style={[styles.dot, index === page && styles.dotActive]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.navy,
  },
  safeArea: {
    flex: 1,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    color: '#cddcf7',
    fontSize: 13,
    fontWeight: '700',
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  brandBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 34,
  },
  brandBadgeText: {
    color: '#cddcf7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  brandTitle: {
    color: Brand.white,
    fontSize: 36,
    fontWeight: '900',
    marginTop: 22,
    letterSpacing: -0.4,
  },
  brandTagline: {
    color: '#a9c2ef',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginTop: 10,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 56,
  },
  footerNoteText: {
    color: '#8fa9d9',
    fontSize: 12,
  },
  introTitle: {
    color: Brand.white,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 32,
  },
  introCopy: {
    color: '#bcccf0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 22,
  },
  buttonWrap: {
    marginTop: 34,
    width: '100%',
  },
  whiteButton: {
    backgroundColor: Brand.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  whiteButtonText: {
    color: Brand.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  accessFooter: {
    color: '#7f97c9',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
  heroBanner: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    backgroundColor: Brand.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlap: {
    marginTop: -32,
    marginBottom: 12,
  },
  servicesTitle: {
    color: Brand.white,
    fontSize: 22,
    fontWeight: '800',
  },
  servicesSubtitle: {
    color: '#a9c2ef',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 6,
    marginBottom: 18,
  },
  featureCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '700',
  },
  featureCopy: {
    color: '#a9c2ef',
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 18,
  },
  blueButton: {
    backgroundColor: Brand.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  blueButtonText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: Brand.white,
    width: 20,
  },
  pressed: {
    opacity: 0.75,
  },
});
