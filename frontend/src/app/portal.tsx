import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LibConnectMark } from '@/components/libconnect-mark';
import { Brand } from '@/constants/brand';
import {
  PortalRole,
  getPortalSession,
  portalBackendId,
  savePortalSession,
} from '@/lib/portal-session';

/**
 * INSTITUTIONAL PORTAL — the three-gateway entry (route "/portal").
 *
 * Screen A (splash) and Screen B (onboarding) hand off here. This screen
 * shows the "SELECT GATEWAY ACCESS" portal with the three institutional
 * gateways:
 *
 *   1. STUDENT / ACADEMIC STAFF → the in-route student login (below), then Home
 *   2. LIBRARY STAFF           → /staff   (separate, privileged)
 *   3. UNIVERSITY MANAGEMENT   → /management (separate, privileged)
 *
 * The student login stays INSIDE this route (a lightweight step toggled by
 * local state) so no extra typed route is needed. The backend id always
 * stays the shared dev identity (EXPO_PUBLIC_STUDENT_ID / demo-student),
 * so Member 2 screens keep seeing the same reservations. Academic Staff
 * uses the student portal and is never routed to /staff.
 */

type GatewayKey = 'student' | 'staff' | 'management';
type PortalView = 'gateway' | 'student-login';

const GATEWAYS: {
  key: GatewayKey;
  icon: ComponentProps<typeof SymbolView>['name'];
  tile: string;
  title: string;
  subtitle: string;
  detail: string;
  a11y: string;
}[] = [
  {
    key: 'student',
    icon: { ios: 'graduationcap.fill', android: 'school', web: 'school' },
    tile: Brand.navy,
    title: 'STUDENT / ACADEMIC STAFF',
    subtitle: 'Access Library Services',
    detail: 'Reserve Catalog • Silent Reading Desks • Loans',
    a11y: 'Open the student and academic staff library portal',
  },
  {
    key: 'staff',
    icon: { ios: 'building.2.fill', android: 'corporate_fare', web: 'corporate_fare' },
    tile: Brand.green,
    title: 'LIBRARY STAFF',
    subtitle: 'Circulation Desk & Operations',
    detail: 'Circulation Desk • Seat Allocations • Scans',
    a11y: 'Open the library staff operations portal',
  },
  {
    key: 'management',
    icon: { ios: 'chart.bar.fill', android: 'insights', web: 'insights' },
    tile: Brand.blue,
    title: 'UNIVERSITY MANAGEMENT',
    subtitle: 'Reports, Analytics & Overview',
    detail: 'Executive Overview • Occupancy Trends • Reports',
    a11y: 'Open the university management portal',
  },
];

const ROLE_OPTIONS: { value: PortalRole; label: string; copy: string }[] = [
  { value: 'student', label: 'Student', copy: 'Reserve books and reading-room seats' },
  { value: 'academic_staff', label: 'Academic Staff', copy: 'Use the same library services portal' },
];

/** Decorative bookshelf spines behind the "Main Stacks" banner overlay. */
const SHELF_SPINES: { w: number; h: number; c: string }[] = [
  { w: 12, h: 62, c: '#2f5079' },
  { w: 8, h: 70, c: '#7a5b34' },
  { w: 10, h: 58, c: '#39684f' },
  { w: 7, h: 66, c: '#8a4747' },
  { w: 13, h: 54, c: '#31527d' },
  { w: 9, h: 72, c: '#6d5a8a' },
  { w: 11, h: 60, c: '#2f6a63' },
  { w: 7, h: 68, c: '#966a2f' },
  { w: 12, h: 56, c: '#365a86' },
  { w: 8, h: 70, c: '#40704f' },
  { w: 10, h: 62, c: '#7a4a52' },
  { w: 9, h: 66, c: '#35567f' },
];

export default function PortalGatewayScreen() {
  const [view, setView] = useState<PortalView>('gateway');

  // --- Student login step (shared state, toggled from the gateway) ---
  const [role, setRole] = useState<PortalRole>('student');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Returning session prefills the display name (dev convenience only).
  useEffect(() => {
    let mounted = true;
    void getPortalSession().then((session) => {
      if (mounted && session) {
        setDisplayName(session.displayName);
        setRole(session.role);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openGateway = (key: GatewayKey) => {
    if (key === 'student') {
      setView('student-login');
      return;
    }
    if (key === 'staff') {
      router.push('/staff');
      return;
    }
    router.push('/management');
  };

  const signIn = () => {
    const name = displayName.trim();
    if (name.length < 2) {
      setError('Enter your name to continue.');
      return;
    }
    setSaving(true);
    setError('');
    void savePortalSession({ id: portalBackendId(), displayName: name, role }).then(() => {
      // router.replace: Home becomes the start of the tab stack, so Back
      // never returns to the portal/login during normal tab use.
      router.replace('/home');
    });
  };

  if (view === 'student-login') {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to gateway selection"
                onPress={() => setView('gateway')}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
                <Text style={styles.backText}>‹ Gateway</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.loginContent}
              keyboardShouldPersistTaps="handled">
              <LibConnectMark size={64} />
              <Text style={styles.loginTitle}>Library Services Portal</Text>
              <Text style={styles.loginSubtitle}>
                Sign in to search the catalog, reserve books, and book reading-room seats.
              </Text>

              <Text style={styles.loginLabel}>I AM A</Text>
              <View style={styles.roleRow}>
                {ROLE_OPTIONS.map((option) => {
                  const selected = option.value === role;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.label}
                      onPress={() => setRole(option.value)}
                      style={[styles.roleCard, selected && styles.roleCardSelected]}>
                      <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.roleCopy, selected && styles.roleCopySelected]}>
                        {option.copy}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.loginLabel}>DISPLAY NAME</Text>
              <TextInput
                accessibilityLabel="Display name"
                autoCapitalize="words"
                onChangeText={(value) => {
                  setDisplayName(value);
                  if (error) setError('');
                }}
                placeholder="e.g. your name"
                placeholderTextColor="#8792a5"
                returnKeyType="done"
                selectionColor={Brand.blue}
                style={styles.input}
                value={displayName}
              />
              <Text style={styles.hint}>
                Development sign-in — no password. Library ID:{' '}
                <Text style={styles.hintStrong}>{portalBackendId()}</Text>
              </Text>

              {error ? (
                <View style={styles.errorRow}>
                  <SymbolView
                    name={{ ios: 'exclamationmark.circle', android: 'error', web: 'error' }}
                    tintColor={Brand.red}
                    size={15}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in to the library portal"
                disabled={saving}
                onPress={signIn}
                style={({ pressed }) => [
                  styles.signInButton,
                  (pressed || saving) && styles.pressed,
                ]}>
                <Text style={styles.signInText}>Continue →</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.gatewayScroll}>
        {/* Institutional hero */}
        <View style={styles.hero}>
          <SafeAreaView style={styles.heroSafe} edges={['top']}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadgeWrap}>
                <View style={styles.heroBadge}>
                  <SymbolView
                    name={{
                      ios: 'building.columns.fill',
                      android: 'account_balance',
                      web: 'account_balance',
                    }}
                    tintColor={Brand.white}
                    size={30}
                  />
                </View>
                <View style={styles.gearBadge} accessibilityElementsHidden>
                  <SymbolView
                    name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                    tintColor={Brand.white}
                    size={10}
                  />
                </View>
              </View>
              <View style={styles.infoDot} accessibilityElementsHidden>
                <Text style={styles.infoDotText}>i</Text>
              </View>
            </View>

            <Text style={styles.heroKicker}>INSTITUTIONAL PORTAL</Text>
            <Text style={styles.heroTitle}>UNIVERSITY LIBRARY</Text>
            <Text style={styles.heroSubtitle}>Book &amp; Reading-Room Reservation</Text>
          </SafeAreaView>
        </View>

        {/* "Main Stacks" banner with decorative bookshelf */}
        <View style={styles.banner}>
          <View style={styles.shelf} accessibilityElementsHidden>
            {SHELF_SPINES.map((spine, index) => (
              <View
                key={index}
                style={{
                  width: spine.w,
                  height: spine.h,
                  backgroundColor: spine.c,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerRow}>
            <View style={styles.bannerLeft}>
              <SymbolView
                name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
                tintColor={Brand.white}
                size={15}
              />
              <Text style={styles.bannerText}>Main Stacks Open • Closes 22:00</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Systems Active</Text>
            </View>
          </View>
        </View>

        {/* Gateway selection */}
        <View style={styles.body}>
          <Text style={styles.sectionHeading}>SELECT GATEWAY ACCESS</Text>

          {GATEWAYS.map((gateway) => (
            <Pressable
              key={gateway.key}
              accessibilityRole="button"
              accessibilityLabel={gateway.a11y}
              onPress={() => openGateway(gateway.key)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <View style={[styles.cardTile, { backgroundColor: gateway.tile }]}>
                <SymbolView name={gateway.icon} tintColor={Brand.white} size={22} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{gateway.title}</Text>
                <Text style={styles.cardSubtitle}>{gateway.subtitle}</Text>
                <Text style={styles.cardDetail}>{gateway.detail}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>University Library Consortium</Text>
            <Text style={styles.footerSub}>System build v4.8 • Single Sign-On Enabled</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // ---- Gateway view ----
  gatewayScroll: {
    flexGrow: 1,
    backgroundColor: Brand.canvas,
  },
  hero: {
    backgroundColor: Brand.navyDeep,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  heroSafe: {
    paddingTop: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadgeWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  gearBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.amber,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Brand.navyDeep,
  },
  infoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDotText: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginTop: 18,
  },
  heroTitle: {
    color: Brand.white,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    marginTop: 4,
  },

  banner: {
    height: 96,
    backgroundColor: Brand.navyDeep,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  shelf: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,18,44,0.55)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    color: Brand.white,
    fontSize: 12,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#31c48d',
  },
  statusText: {
    color: Brand.white,
    fontSize: 11.5,
    fontWeight: '700',
  },

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  sectionHeading: {
    color: Brand.ink,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: Brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0b1e4d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: Brand.paleBlue,
  },
  cardTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: Brand.ink,
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: Brand.blue,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDetail: {
    color: Brand.muted,
    fontSize: 11,
    marginTop: 3,
  },
  chevron: {
    color: Brand.muted,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 18,
    gap: 3,
  },
  footerTitle: {
    color: Brand.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  footerSub: {
    color: Brand.muted,
    fontSize: 11,
  },

  // ---- Student login step ----
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  backText: {
    color: Brand.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  loginContent: {
    padding: 24,
    paddingTop: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  loginTitle: {
    color: Brand.ink,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 18,
  },
  loginSubtitle: {
    color: Brand.muted,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  loginLabel: {
    color: Brand.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 26,
    marginBottom: 10,
  },
  roleRow: {
    gap: 10,
  },
  roleCard: {
    backgroundColor: Brand.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.line,
    padding: 16,
  },
  roleCardSelected: {
    borderColor: Brand.blue,
    backgroundColor: Brand.paleBlue,
  },
  roleLabel: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  roleLabelSelected: {
    color: Brand.navy,
  },
  roleCopy: {
    color: Brand.muted,
    fontSize: 12.5,
    marginTop: 4,
  },
  roleCopySelected: {
    color: Brand.blue,
  },
  input: {
    backgroundColor: Brand.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Brand.ink,
  },
  hint: {
    color: Brand.muted,
    fontSize: 12,
    marginTop: 8,
  },
  hintStrong: {
    color: Brand.ink,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  errorText: {
    color: Brand.red,
    fontSize: 13,
    flex: 1,
  },
  signInButton: {
    backgroundColor: Brand.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  signInText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
