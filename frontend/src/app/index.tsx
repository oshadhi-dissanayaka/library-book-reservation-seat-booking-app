import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isOnboardingComplete, resetOnboarding } from '@/lib/portal-session';
import { AuthHomeRoute, homeRouteForRole, loadAuthSession } from '@/lib/auth-session';

/**
 * SCREEN A — Branded launch splash (route "/").
 *
 * Shown on every cold launch. After a short timed fade it hands off to:
 *   - the signed-in role's dashboard when a valid session exists (a logged-in
 *     user never sees the role-selection gateway again)
 *   - /onboarding  (first launch, onboarding not completed yet)
 *   - /portal      (onboarding done, nobody signed in)
 *
 * Development reset: tap the institutional footer 5 times to clear the
 * onboarding flag and re-enter the onboarding flow. No settings screen.
 */

const SPLASH_MIN_MS = 1800;
const DEV_TAP_COUNT = 5;

type SplashDestination = '/onboarding' | '/portal' | AuthHomeRoute;

/**
 * Launch decision. Reads the stored auth session first, then the onboarding
 * flag, and resolves to exactly one destination:
 *
 *   1. valid session                    -> role destination
 *        student / academic_staff       -> /home
 *        library_staff                  -> /staff (staff dashboard)
 *        management                     -> /management/library-overview
 *   2. onboarding not complete          -> /onboarding
 *   3. otherwise                        -> /portal
 */
async function decideLaunchDestination(): Promise<SplashDestination> {
  const session = await loadAuthSession();
  if (session) return homeRouteForRole(session.user.role);

  const onboardingDone = await isOnboardingComplete();
  if (!onboardingDone) return '/onboarding';
  return '/portal';
}

export default function LaunchSplashScreen() {
  // Lazy useState (not useRef().current) — refs must not be read during render.
  const [fade] = useState(() => new Animated.Value(0));
  const [destination, setDestination] = useState<SplashDestination | null>(null);
  const devTapTimes = useRef<number[]>([]);
  // Ensures the launch navigation fires exactly once (no double replace).
  const navigatedRef = useRef(false);

  // Decide the destination while the splash is visible.
  useEffect(() => {
    let mounted = true;

    const decide = async () => {
      const startedAt = Date.now();
      const next = await decideLaunchDestination();
      if (!mounted) return;

      // Keep the splash on screen for at least SPLASH_MIN_MS.
      const remaining = Math.max(0, SPLASH_MIN_MS - (Date.now() - startedAt));
      setTimeout(() => {
        if (mounted) setDestination(next);
      }, remaining);
    };

    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    void decide();

    return () => {
      mounted = false;
    };
  }, [fade]);

  // Navigate once the decision is ready. router.replace (not push) keeps the
  // splash out of the back stack, and the ref guard makes it single-shot, so
  // there is no intermediate portal flash and no route loop.
  useEffect(() => {
    if (!destination || navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(destination);
  }, [destination]);

  const handleDevFooterTap = () => {
    if (!__DEV__) return;
    const now = Date.now();
    devTapTimes.current = [...devTapTimes.current.filter((t) => now - t < 2500), now];
    if (devTapTimes.current.length >= DEV_TAP_COUNT) {
      devTapTimes.current = [];
      void resetOnboarding().then(() => router.replace('/onboarding'));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fade }]}>
          <View style={styles.logoWrap}>
            <View style={styles.glowRing} />
            <View style={styles.logoMark}>
              <SymbolView
                name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
                tintColor="#102b69"
                size={38}
              />
            </View>
          </View>

          <Text style={styles.title}>LibConnect</Text>
          <Text style={styles.institution}>UNIVERSITY LIBRARY SERVICES</Text>
          <Text style={styles.tagline}>Connect. Reserve. Study.</Text>
        </Animated.View>

        <Pressable
          accessibilityRole={__DEV__ ? 'button' : undefined}
          accessibilityLabel={__DEV__ ? 'Reset onboarding (development)' : undefined}
          disabled={!__DEV__}
          onPress={handleDevFooterTap}
          style={styles.footer}>
          <Text style={styles.footerHeading}>University Library Information System</Text>
          <Text style={styles.footerSub}>Integrated Library Management &amp; Learning Resource Centre</Text>
          {__DEV__ ? <Text style={styles.devHint}>DEV · tap 5× to reset onboarding</Text> : null}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#102b69',
  },
  glow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#2456b3',
    opacity: 0.35,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    opacity: 0.12,
  },
  logoMark: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  institution: {
    color: '#a9c2ef',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginTop: 10,
  },
  tagline: {
    color: '#dbe6fa',
    fontSize: 15,
    marginTop: 18,
    letterSpacing: 0.6,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerHeading: {
    color: '#f2f6fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerSub: {
    color: '#8fa9d9',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  devHint: {
    color: '#6f8ccb',
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 0.4,
  },
});
