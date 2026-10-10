import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
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
import { fetchApprovedIdentity, signIn, signUp } from '@/lib/auth-api';
import { homeRouteForRole, loadAuthSession } from '@/lib/auth-session';
import { PortalRole } from '@/lib/portal-session';

/**
 * INSTITUTIONAL PORTAL - the three-gateway entry (route "/portal").
 *
 * Screen A (splash) and Screen B (onboarding) hand off here. This screen
 * shows the "SELECT GATEWAY ACCESS" portal with the three institutional
 * gateways:
 *
 *   1. STUDENT / ACADEMIC STAFF -> real Login / Sign Up (institutional ID +
 *      password against the backend auth API), then Home
 *   2. LIBRARY STAFF           -> /staff  (login only, no signup)
 *   3. UNIVERSITY MANAGEMENT   -> /management (login only, no signup)
 *
 * Signup is validated server-side against ApprovedIdentity: the ID must be
 * recognized, active, unused, and the university email + selected role must
 * match the approved identity.
 */

type GatewayKey = 'student' | 'staff' | 'management';
type PortalView = 'gateway' | 'student-login' | 'student-signup';

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
      detail: 'Reserve Catalog — Silent Reading Desks — Loans',
      a11y: 'Open the student and academic staff library portal',
    },
    {
      key: 'staff',
      icon: { ios: 'building.2.fill', android: 'corporate_fare', web: 'corporate_fare' },
      tile: Brand.green,
      title: 'LIBRARY STAFF',
      subtitle: 'Circulation Desk & Operations',
      detail: 'Circulation Desk — Seat Allocations — Scans',
      a11y: 'Open the library staff operations portal',
    },
    {
      key: 'management',
      icon: { ios: 'chart.bar.fill', android: 'insights', web: 'insights' },
      tile: Brand.blue,
      title: 'UNIVERSITY MANAGEMENT',
      subtitle: 'Reports, Analytics & Overview',
      detail: 'Executive Overview — Occupancy Trends — Reports',
      a11y: 'Open the university management portal',
    },
  ];

const ROLE_OPTIONS: { value: PortalRole; label: string; copy: string }[] = [
  { value: 'student', label: 'Student', copy: 'Reserve books and reading-room seats' },
  { value: 'academic_staff', label: 'Academic Staff', copy: 'Use the same library services portal' },
];

/**
 * Primary Sign In / Create Account colours.
 *
 * These are applied as a plain `style` OBJECT on the Pressable — never as a
 * `style={({ pressed }) => ...}` callback. This app compiles JSX through
 * NativeWind's css-interop runtime (babel.config.js -> jsxImportSource
 * 'nativewind'), which re-derives the `style` prop of Pressable/View/Text and
 * only understands plain style objects. A style *callback* is collected as a
 * declaration, spread into `{}`, and then REPLACES the real style — so the
 * button rendered with no background at all (pale canvas behind white label =
 * invisible white button), no matter what colours were written inside it.
 */
const PRIMARY_ENABLED = '#2456B3'; // LibConnect brand blue
const PRIMARY_PRESSED = '#102B69'; // dark navy while pressed
const PRIMARY_LOADING = '#102B69'; // solid navy while the request is in flight

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

function roleLabel(role: PortalRole): string {
  return role === 'academic_staff' ? 'Academic Staff' : 'Student';
}

export default function PortalGatewayScreen() {
  const [view, setView] = useState<PortalView>('gateway');

  // --- Shared student / academic-staff auth state ---
  const [role, setRole] = useState<PortalRole>('student');
  const [institutionalId, setInstitutionalId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [identityHint, setIdentityHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Press feedback for the primary action. Tracked in React state (instead of
  // a Pressable style callback) so the style handed to Native is always a
  // plain object — see PRIMARY_* constants above.
  const [primaryPressed, setPrimaryPressed] = useState(false);

  // Field refs let the keyboard "next" key move focus to the next input, so
  // the user never has to scroll blindly for the field below while the
  // software keyboard is open.
  const idInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Returning session prefills the institutional ID (convenience only).
  useEffect(() => {
    let mounted = true;
    void loadAuthSession().then((session) => {
      if (!mounted || !session) return;
      setInstitutionalId(session.user.institutionalId);
      if (session.user.role === 'student' || session.user.role === 'academic_staff') {
        setRole(session.user.role);
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

  const resetForm = (nextView: PortalView) => {
    setError('');
    setSaving(false);
    setPrimaryPressed(false);
    setIdentityHint('');
    setView(nextView);
  };

  /**
   * Signup-only: loads the approved identity so the assigned university email
   * and name come from the university record instead of free text.
   */
  const lookupIdentity = async (
    idValue: string,
    roleValue: PortalRole
  ): Promise<void> => {
    const id = idValue.trim().toUpperCase();
    if (id.length < 3) {
      setIdentityHint('');
      return;
    }
    try {
      const identity = await fetchApprovedIdentity(id);
      if (!identity) {
        setIdentityHint('Institutional ID not recognized.');
        return;
      }
      if (!identity.active) {
        setIdentityHint('This institutional ID is inactive. Contact your university.');
        return;
      }
      if (identity.registered) {
        setIdentityHint('This institutional ID is already registered. Please sign in.');
        return;
      }
      if (identity.role !== roleValue) {
        setIdentityHint(`This ID is approved as ${roleLabel(identity.role)}.`);
        return;
      }
      setIdentityHint(`Verified: ${identity.name} — use ${identity.email}`);
      setEmail(identity.email);
    } catch {
      // Network/lookup issues are surfaced by the signup request itself.
      setIdentityHint('');
    }
  };

  const handleSignIn = () => {
    const id = institutionalId.trim().toUpperCase();
    if (!id) {
      setError('Enter your institutional ID.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setSaving(true);
    setError('');
    void signIn({ institutionalId: id, password, role })
      .then((session) => {
        // router.replace: Home becomes the start of the tab stack, so Back
        // never returns to the portal/login during normal tab use.
        router.replace(homeRouteForRole(session.user.role));
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to sign in. Please try again.'
        );
      })
      .finally(() => {
        setSaving(false);
        // Clear stuck press state in case `disabled` flipped mid-press.
        setPrimaryPressed(false);
      });
  };

  const handleSignUp = () => {
    const id = institutionalId.trim().toUpperCase();
    const universityEmail = email.trim().toLowerCase();

    if (!id) {
      setError('Enter your institutional ID.');
      return;
    }
    if (!universityEmail) {
      setError('Enter your university email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain both letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    void signUp({
      institutionalId: id,
      email: universityEmail,
      password,
      confirmPassword,
      role,
    })
      .then((session) => {
        router.replace(homeRouteForRole(session.user.role));
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to create the account. Please try again.'
        );
      })
      .finally(() => {
        setSaving(false);
        // Clear stuck press state in case `disabled` flipped mid-press.
        setPrimaryPressed(false);
      });
  };

  if (view === 'student-login' || view === 'student-signup') {
    const isSignup = view === 'student-signup';
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {/*
            Keyboard-safe shell (Sign In + Create Account):
            KeyboardAvoidingView > ScrollView > form content.
            iOS uses behavior="padding"; Android keeps the project's existing
            pattern (no explicit behavior) and relies on Expo's default
            android.softwareKeyboardLayoutMode = "resize", which shrinks the
            window so the bounded ScrollView below scrolls every lower field
            above the keyboard.
          */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={styles.flex}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to gateway selection"
                onPress={() => resetForm('gateway')}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
                <Text style={styles.backText}>← Gateway</Text>
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.loginContent}
              keyboardShouldPersistTaps="handled">
              <LibConnectMark size={64} />
              <Text style={styles.loginTitle}>
                {isSignup ? 'Create Your Account' : 'Library Services Portal'}
              </Text>
              <Text style={styles.loginSubtitle}>
                {isSignup
                  ? 'Register with your institutional ID and university email to start reserving books and seats.'
                  : 'Sign in to search the catalog, reserve books, and book reading-room seats.'}
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
                      onPress={() => {
                        setRole(option.value);
                        if (error) setError('');
                      }}
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

              <Text style={styles.loginLabel}>INSTITUTIONAL ID</Text>
              <TextInput
                accessibilityLabel="Institutional ID"
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={(value) => {
                  setInstitutionalId(value);
                  if (error) setError('');
                }}
                onBlur={() => {
                  if (isSignup) void lookupIdentity(institutionalId, role);
                }}
                onSubmitEditing={() =>
                  (isSignup ? emailInputRef.current : passwordInputRef.current)?.focus()
                }
                placeholder="e.g. IT23846586"
                placeholderTextColor="#8792a5"
                ref={idInputRef}
                returnKeyType="next"
                selectionColor={Brand.blue}
                style={styles.input}
                value={institutionalId}
              />

              {isSignup ? (
                <>
                  <Text style={styles.loginLabel}>UNIVERSITY EMAIL</Text>
                  <TextInput
                    accessibilityLabel="University email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onFocus={() => {
                      setTimeout(() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (error) setError('');
                    }}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    placeholder="e.g. yourname@sliit.lk"
                    placeholderTextColor="#8792a5"
                    ref={emailInputRef}
                    returnKeyType="next"
                    selectionColor={Brand.blue}
                    style={styles.input}
                    value={email}
                  />
                  {identityHint ? <Text style={styles.hint}>{identityHint}</Text> : null}
                </>
              ) : null}

              <Text style={styles.loginLabel}>PASSWORD</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete={isSignup ? 'new-password' : 'password'}
                autoCorrect={false}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError('');
                }}
                onSubmitEditing={() => {
                  if (isSignup) confirmPasswordInputRef.current?.focus();
                }}
                placeholder={isSignup ? 'At least 8 characters, letters and numbers' : '••••••••'}
                placeholderTextColor="#8792a5"
                ref={passwordInputRef}
                returnKeyType={isSignup ? 'next' : 'done'}
                secureTextEntry
                selectionColor={Brand.blue}
                style={styles.input}
                value={password}
              />

              {isSignup ? (
                <>
                  <Text style={styles.loginLabel}>CONFIRM PASSWORD</Text>
                  <TextInput
                    accessibilityLabel="Confirm password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect={false}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      if (error) setError('');
                    }}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#8792a5"
                    ref={confirmPasswordInputRef}
                    returnKeyType="done"
                    secureTextEntry
                    selectionColor={Brand.blue}
                    style={styles.input}
                    value={confirmPassword}
                  />
                </>
              ) : (
                <Text style={styles.hint}>
                  Use the institutional ID issued by your university.
                </Text>
              )}

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
                accessibilityLabel={isSignup ? 'Create account' : 'Sign in to the library portal'}
                accessibilityState={{ disabled: saving, busy: saving }}
                disabled={saving}
                onPress={isSignup ? handleSignUp : handleSignIn}
                onPressIn={() => setPrimaryPressed(true)}
                onPressOut={() => setPrimaryPressed(false)}
                style={{
                  // Explicit inline style OBJECT (never a style callback) so no
                  // NativeWind css-interop pass can replace it with `{}`.
                  backgroundColor: saving
                    ? PRIMARY_LOADING
                    : primaryPressed
                      ? PRIMARY_PRESSED
                      : PRIMARY_ENABLED,
                  opacity: 1,
                  minHeight: 54,
                  width: '100%',
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  marginTop: 26,
                  marginBottom: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#0b1e4d',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 10,
                  elevation: 5,
                }}>
                {saving ? (
                  <ActivityIndicator color={Brand.white} size="small" />
                ) : (
                  <Text style={styles.signInText}>{isSignup ? 'Create Account' : 'Sign In'}</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isSignup ? 'Back to sign in' : 'Create a new account'}
                disabled={saving}
                onPress={() => {
                  setError('');
                  setIdentityHint('');
                  setPassword('');
                  setConfirmPassword('');
                  setPrimaryPressed(false);
                  setView(isSignup ? 'student-login' : 'student-signup');
                }}
                style={({ pressed }) => [styles.switchAuthBtn, pressed && styles.pressed]}>
                <Text style={styles.switchAuthText}>
                  {isSignup
                    ? 'Already have an account? Sign in'
                    : 'New here? Create an account'}
                </Text>
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
              <Text style={styles.bannerText}>Main Stacks Open — Closes 22:00</Text>
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
            <Text style={styles.footerSub}>System build v4.8 — Single Sign-On Enabled</Text>
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

  // ---- Student / academic-staff login + signup step ----
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
    // flexGrow keeps the content container at least as tall as the viewport
    // (so it stays top-aligned and scrollable), and the generous bottom
    // padding lets the last field and the submit button scroll clear of the
    // software keyboard.
    flexGrow: 1,
    paddingBottom: 48,
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
    marginTop: 22,
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
  /**
   * The primary Sign In / Create Account button styles now live inline on the
   * Pressable (see PRIMARY_ENABLED / PRIMARY_PRESSED / PRIMARY_LOADING above).
   * They are inline, not StyleSheet entries, because NativeWind's css-interop
   * runtime only re-emits plain style objects — a style callback function was
   * being replaced with `{}` on device, which made the button render with no
   * background at all (invisible white button).
   */
  signInText: {
    color: Brand.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  switchAuthBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  switchAuthText: {
    color: Brand.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
