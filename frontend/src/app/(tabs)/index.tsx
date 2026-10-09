import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import BookSearchScreen from '@/app/index';

type AppStep =
  | 'splash'
  | 'welcome'
  | 'onboarding'
  | 'roleSelection'
  | 'studentLogin'
  | 'studentHome'
  | 'bookSearch';

export default function AppEntryFlow() {
  const [step, setStep] = useState<AppStep>('splash');
  const [loginId, setLoginId] = useState('U-948210');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);

  // Splash auto-transition after 2 seconds
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('welcome');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // If user chooses to search books from Home or directly
  if (step === 'bookSearch') {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Top return bar */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#102B69' }}>
          <View style={styles.topBackBar}>
            <TouchableOpacity
              onPress={() => setStep('studentHome')}
              style={styles.backButton}>
              <Text style={styles.backButtonText}>← Dashboard Home</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Book Catalog & Reservation</Text>
          </View>
        </SafeAreaView>
        <BookSearchScreen />
      </View>
    );
  }

  // SCREEN 1: LibConnect — Splash Screen
  if (step === 'splash') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#102B69' }]}>
        <SafeAreaView style={styles.splashContainer}>
          <View style={styles.splashTopRow}>
            <Text style={styles.splashTopText}>🏛️ ARCHIVAL & RESEARCH</Text>
            <View style={styles.liveAccessPill}>
              <View style={styles.greenPulse} />
              <Text style={styles.liveAccessText}>Live Access</Text>
            </View>
          </View>

          <View style={styles.splashCenter}>
            <View style={styles.splashLogoCircle}>
              <Text style={{ fontSize: 44 }}>📖</Text>
              <Text style={styles.splashLogoLabel}>LibConnect</Text>
            </View>
            <Text style={styles.splashMainTitle}>LibConnect</Text>
            <Text style={styles.splashSubtitle}>UNIVERSITY LIBRARY SERVICES</Text>
            <Text style={styles.splashMotto}>Connect. Reserve. Study.</Text>
            <View style={styles.dotLoader}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          <View style={styles.splashBottom}>
            <Text style={styles.splashFooterText}>
              🛡️ Official Institutional Network
            </Text>
            <Text style={styles.splashFooterSub}>
              University Library System • Version 2.4
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // SCREEN 2: LibConnect — Welcome Screen
  if (step === 'welcome') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#0B1F4D' }]}>
        <SafeAreaView style={styles.welcomeContainer}>
          <View style={styles.welcomeTopPillRow}>
            <View style={styles.welcomeTopPill}>
              <View style={styles.smallBlueDot} />
              <Text style={styles.welcomeTopPillText}>UNIVERSITY LIBRARY SERVICES</Text>
            </View>
          </View>

          <View style={styles.welcomeCenter}>
            <View style={styles.welcomeLogoCard}>
              <Text style={{ fontSize: 48 }}>📖</Text>
              <Text style={styles.welcomeCardBrand}>LibConnect</Text>
            </View>
            <Text style={styles.welcomeTitle}>LibConnect</Text>
            <Text style={styles.welcomeTagline}>CONNECT • RESERVE • STUDY</Text>
            <Text style={styles.welcomeDescription}>
              Your digital gateway to university books,{'\n'}archives, and reading-room seats.
            </Text>
          </View>

          <View style={styles.welcomeBottom}>
            <TouchableOpacity
              style={styles.whiteGetStartedBtn}
              onPress={() => setStep('onboarding')}
              activeOpacity={0.85}>
              <Text style={styles.whiteGetStartedText}>Get Started →</Text>
            </TouchableOpacity>
            <View style={styles.securityRow}>
              <Text style={styles.securityRowText}>
                🔒 Official Institutional Access • University Library Network
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // SCREEN 3: LibConnect — Onboarding Screen
  if (step === 'onboarding') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#F8FAFC' }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.onboardingContent}
            showsVerticalScrollIndicator={false}>
            {/* Library Hero Banner */}
            <View style={styles.onboardingHeroBanner}>
              <View style={styles.heroOverlayBadge}>
                <Text style={{ fontSize: 32 }}>🏛️</Text>
                <Text style={styles.heroOverlayText}>Central Campus Library</Text>
              </View>
              <View style={styles.floatingBrandBadge}>
                <Text style={{ fontSize: 24 }}>📖</Text>
                <Text style={styles.floatingBrandText}>LibConnect</Text>
              </View>
            </View>

            <View style={styles.onboardingCardBody}>
              <View style={styles.onboardingPillRow}>
                <View style={styles.blueChip}>
                  <Text style={styles.blueChipText}>• UNIVERSITY LIBRARY SERVICES</Text>
                </View>
              </View>

              <Text style={styles.onboardingTitle}>LibConnect</Text>
              <Text style={styles.onboardingSubtitle}>Connect. Reserve. Study.</Text>
              <Text style={styles.onboardingDesc}>
                Reserve library books and reading-room seats from one convenient place.
              </Text>

              {/* Service Cards */}
              <View style={styles.featureBox}>
                <View style={styles.featureIconWrap}>
                  <Text style={{ fontSize: 22 }}>📚</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.featureHeading}>Book Reservation</Text>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>Catalog</Text>
                    </View>
                  </View>
                  <Text style={styles.featureSub}>
                    Search & reserve physical volumes from campus stacks
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>

              <View style={[styles.featureBox, { marginTop: 12 }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={{ fontSize: 22 }}>🪑</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.featureHeading}>Reading-Room Seats</Text>
                    <View style={[styles.featureBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.featureBadgeText, { color: '#15803D' }]}>
                        Real-time
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.featureSub}>
                    Check seat availability & reserve quiet study spaces
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>

              <View style={styles.statusInfoRow}>
                <View style={styles.greenDot} />
                <Text style={styles.statusInfoText}>Central Reading Hall</Text>
                <Text style={styles.statusTimeText}>🕒 Open until 22:00</Text>
              </View>

              {/* Button */}
              <TouchableOpacity
                style={styles.blueMainBtn}
                onPress={() => setStep('roleSelection')}
                activeOpacity={0.85}>
                <Text style={styles.blueMainBtnText}>GET STARTED →</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimerText}>
                Institutional Academic Account Access • LibConnect v2.4{'\n'}
                🛡️ Authorized University Terminals & Mobile Portals
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // SCREEN 4: WF-01 — Welcome / Role Selection (Figma Light Theme)
  if (step === 'roleSelection') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#F8FAFC' }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.roleSelectionContent}
            showsVerticalScrollIndicator={false}>
            {/* Top Crest */}
            <View style={styles.roleSelectionHeader}>
              <View style={styles.institutionCrest}>
                <Text style={{ fontSize: 28 }}>🏛️</Text>
              </View>
              <Text style={styles.crestTag}>INSTITUTIONAL PORTAL</Text>
              <Text style={styles.crestTitle}>UNIVERSITY LIBRARY</Text>
              <Text style={styles.crestSubtitle}>
                Book & Reading-Room Reservation System
              </Text>
            </View>

            {/* Middle Photo Banner */}
            <View style={styles.libraryBannerBox}>
              <View style={styles.bannerBadgeOverlay}>
                <Text style={styles.bannerBadgeText}>
                  🕒 Main Stacks Open • Closes 22:00
                </Text>
              </View>
            </View>

            <View style={styles.gatewayLabelRow}>
              <Text style={styles.gatewaySectionTitle}>SELECT GATEWAY ACCESS</Text>
              <View style={styles.activePill}>
                <View style={styles.greenPulse} />
                <Text style={styles.activePillText}>Systems Active</Text>
              </View>
            </View>

            {/* Role 1: Student & Academic Staff */}
            <TouchableOpacity
              style={styles.roleGatewayCard}
              onPress={() => setStep('studentLogin')}
              activeOpacity={0.85}>
              <View style={[styles.roleGatewayIconWrap, { backgroundColor: '#1E3A8A' }]}>
                <Text style={{ fontSize: 24, color: '#FFFFFF' }}>🎓</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.roleGatewayTitle}>STUDENT / ACADEMIC STAFF</Text>
                </View>
                <Text style={styles.roleGatewayDesc}>Access Library Services</Text>
                <View style={styles.roleGatewayPillsRow}>
                  <Text style={styles.pillNote}>📖 Reserve Catalog</Text>
                  <Text style={styles.pillNote}>🪑 Silent Desks</Text>
                  <Text style={styles.pillNote}>🏷️ Loans</Text>
                </View>
              </View>
              <View style={styles.circleChevron}>
                <Text style={{ color: '#1E3A8A', fontWeight: 'bold' }}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Role 2: Library Staff */}
            <TouchableOpacity
              style={styles.roleGatewayCard}
              onPress={() => router.push('/staff' as any)}
              activeOpacity={0.85}>
              <View style={[styles.roleGatewayIconWrap, { backgroundColor: '#0284C7' }]}>
                <Text style={{ fontSize: 24, color: '#FFFFFF' }}>🏢</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.roleGatewayTitle}>LIBRARY STAFF</Text>
                <Text style={styles.roleGatewayDesc}>
                  Circulation Desk & Operations
                </Text>
                <View style={styles.roleGatewayPillsRow}>
                  <Text style={styles.pillNote}>📋 Circulation Desk</Text>
                  <Text style={styles.pillNote}>🪑 Seat Allocations</Text>
                </View>
              </View>
              <View style={styles.circleChevron}>
                <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Role 3: University Management */}
            <TouchableOpacity
              style={styles.roleGatewayCard}
              onPress={() => router.push('/management' as any)}
              activeOpacity={0.85}>
              <View style={[styles.roleGatewayIconWrap, { backgroundColor: '#4338CA' }]}>
                <Text style={{ fontSize: 24, color: '#FFFFFF' }}>📊</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.roleGatewayTitle}>UNIVERSITY MANAGEMENT</Text>
                <Text style={styles.roleGatewayDesc}>Reports, Analytics & Overview</Text>
                <View style={styles.roleGatewayPillsRow}>
                  <Text style={styles.pillNote}>📈 Executive Overview</Text>
                  <Text style={styles.pillNote}>📉 Occupancy Trends</Text>
                </View>
              </View>
              <View style={styles.circleChevron}>
                <Text style={{ color: '#4338CA', fontWeight: 'bold' }}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.consortiumFooter}>
              <Text style={styles.consortiumTitle}>🏛️ University Library Consortium</Text>
              <Text style={styles.consortiumSub}>
                System build v4.8 • Single Sign-On Enabled
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // SCREEN 5: WF-02 — Student Login
  if (step === 'studentLogin') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#F8FAFC' }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.loginContent}
            showsVerticalScrollIndicator={false}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => setStep('roleSelection')}
              style={styles.inlineBackBtn}>
              <Text style={styles.inlineBackBtnText}>‹ Back to Gateways</Text>
            </TouchableOpacity>

            {/* Central Research Commons Banner */}
            <View style={styles.loginBannerBox}>
              <Text style={styles.loginBannerSub}>UNIVERSITY CATALOG & ARCHIVE</Text>
              <Text style={styles.loginBannerTitle}>Central Research Commons</Text>
            </View>

            {/* Form */}
            <View style={styles.loginFormBox}>
              <Text style={styles.loginTitle}>▍Library Portal</Text>
              <Text style={styles.loginSubtitle}>
                Access reserved study desks, interlibrary borrowing, and digital scholarly repositories.
              </Text>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Username / Student ID</Text>
                  <Text style={styles.inputHint}>e.g. U-948210</Text>
                </View>
                <View style={styles.inputFieldWrap}>
                  <Text style={styles.inputFieldIcon}>🆔</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loginId}
                    onChangeText={setLoginId}
                    placeholder="Enter username"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={[styles.inputGroup, { marginTop: 14 }]}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputFieldWrap}>
                  <Text style={styles.inputFieldIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={{ fontSize: 18, color: '#64748B' }}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.blueMainBtn}
                onPress={() => setStep('studentHome')}
                activeOpacity={0.85}>
                <Text style={styles.blueMainBtnText}>LOGIN →</Text>
              </TouchableOpacity>

              <View style={styles.ssoInfoBox}>
                <Text style={{ fontSize: 16 }}>ℹ️</Text>
                <Text style={styles.ssoInfoText}>
                  Use your university library management account or student campus SSO credentials. Sessions automatically sync with desktop turnstiles.
                </Text>
              </View>

              {/* Bottom indicators */}
              <View style={styles.statusTwinBox}>
                <View style={styles.twinCard}>
                  <Text style={styles.twinCardLabel}>📖 Active Floor</Text>
                  <Text style={styles.twinCardVal}>Floor 2 & 3 Open</Text>
                  <Text style={styles.twinCardSub}>Quiet study zones live</Text>
                </View>
                <View style={styles.twinCard}>
                  <Text style={styles.twinCardLabel}>🏢 Circulation</Text>
                  <Text style={styles.twinCardVal}>Desk Level 1</Text>
                  <Text style={styles.twinCardSub}>Assistance until 10 PM</Text>
                </View>
              </View>

              <Text style={styles.securityFooterText}>
                🔒 Strict SSL / TLS 1.3 • Institutional Library Services Network
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // SCREEN 6: WF-03 — Student Home Dashboard
  return (
    <View style={[styles.fullScreen, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.homeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.homeHeaderBadge}>
                <Text style={{ fontSize: 20 }}>🏛️</Text>
              </View>
              <Text style={styles.homeHeaderTitle}>Home</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push('/notifications' as any)}
                style={styles.homeIconBtn}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep('roleSelection')}
                style={[styles.homeIconBtn, { marginLeft: 8 }]}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Pasindu Banner */}
          <View style={styles.welcomeStudentRow}>
            <View>
              <Text style={styles.welcomeStudentPre}>WELCOME BACK</Text>
              <Text style={styles.welcomeStudentName}>Good morning, Pasindu</Text>
            </View>
            <View style={styles.libraryOpenBadge}>
              <View style={styles.greenPulse} />
              <Text style={styles.libraryOpenText}>Library Open</Text>
            </View>
          </View>

          {/* Search Bar Input */}
          <TouchableOpacity
            style={styles.searchBarBox}
            onPress={() => setStep('bookSearch')}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
            <Text style={styles.searchBarPlaceholder}>Search books, authors, ISBN</Text>
          </TouchableOpacity>

          {/* Quick Access */}
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
            <Text style={styles.sectionCampusTag}>Campus Center</Text>
          </View>

          <View style={styles.quickAccessTwin}>
            {/* Books Card */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => setStep('bookSearch')}
              activeOpacity={0.85}>
              <View style={[styles.quickCardIcon, { backgroundColor: '#EFF6FF' }]}>
                <Text style={{ fontSize: 24 }}>📖</Text>
              </View>
              <Text style={styles.quickCardTitle}>Books</Text>
              <Text style={styles.quickCardSub}>Search & Reserve</Text>
              <Text style={styles.quickCardLink}>Explore →</Text>
            </TouchableOpacity>

            {/* Reading Room Card */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/reading-rooms' as any)}
              activeOpacity={0.85}>
              <View style={[styles.quickCardIcon, { backgroundColor: '#F0FDF4' }]}>
                <Text style={{ fontSize: 24 }}>🪑</Text>
              </View>
              <Text style={styles.quickCardTitle}>Reading Room</Text>
              <Text style={styles.quickCardSub}>Seat Availability</Text>
              <Text style={[styles.quickCardLink, { color: '#16A34A' }]}>View Map →</Text>
            </TouchableOpacity>
          </View>

          {/* Active Reservation Pass */}
          <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>ACTIVE RESERVATION</Text>
            <TouchableOpacity onPress={() => router.push('/reservations' as any)}>
              <Text style={styles.viewPassLink}>View Pass</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activeReservationCard}>
            <View style={styles.activeReservationHeader}>
              <View style={styles.confirmedPill}>
                <Text style={styles.confirmedPillText}>✓ CONFIRMED</Text>
              </View>
              <Text style={styles.resCode}>RES-8842</Text>
            </View>

            <View style={styles.activeReservationBody}>
              <View style={styles.bookCoverThumb}>
                <Text style={{ fontSize: 24 }}>📚</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.activeBookTitle}>Database Systems</Text>
                <Text style={styles.activeBookMeta}>Main Library • 16 Sep</Text>
                <Text style={styles.activeBookShelf}>📍 Shelf B-12 • Pick up by 4:00 PM</Text>
              </View>
            </View>

            <View style={styles.activeReservationFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>⏱️</Text>
                <Text style={styles.timerNotice}>Hold expires in 3h 24m</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/reservations' as any)}
                style={styles.digitalIdBtn}>
                <Text style={styles.digitalIdBtnText}>Digital ID</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Secondary Gateways Switcher */}
          <View style={styles.gatewaySwitchBox}>
            <Text style={styles.gatewaySwitchLabel}>Need administrative terminals?</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={styles.switchSmallBtn}
                onPress={() => router.push('/staff' as any)}>
                <Text style={styles.switchSmallBtnText}>Staff Portal →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.switchSmallBtn, { marginLeft: 10, backgroundColor: '#312E81' }]}
                onPress={() => router.push('/management' as any)}>
                <Text style={styles.switchSmallBtnText}>Management Portal →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  topBackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // SPLASH
  splashContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  splashTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  splashTopText: {
    color: '#93C5FD',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  liveAccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  liveAccessText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  splashCenter: {
    alignItems: 'center',
  },
  splashLogoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  splashLogoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#102B69',
  },
  splashMainTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  splashSubtitle: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 6,
  },
  splashMotto: {
    color: '#E0E7FF',
    fontSize: 13,
    marginTop: 8,
  },
  dotLoader: {
    flexDirection: 'row',
    marginTop: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 22,
  },
  splashBottom: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  splashFooterText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '500',
  },
  splashFooterSub: {
    color: '#60A5FA',
    fontSize: 10,
    marginTop: 2,
  },

  // WELCOME
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  welcomeTopPillRow: {
    alignItems: 'center',
    paddingTop: 10,
  },
  welcomeTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  smallBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: 8,
  },
  welcomeTopPillText: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  welcomeCenter: {
    alignItems: 'center',
  },
  welcomeLogoCard: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeCardBrand: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#102B69',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  welcomeTagline: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginTop: 8,
  },
  welcomeDescription: {
    color: '#E2E8F0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 14,
  },
  welcomeBottom: {
    paddingBottom: 16,
  },
  whiteGetStartedBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  whiteGetStartedText: {
    color: '#102B69',
    fontSize: 16,
    fontWeight: '800',
  },
  securityRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  securityRowText: {
    color: '#93C5FD',
    fontSize: 10,
  },

  // ONBOARDING
  onboardingContent: {
    paddingBottom: 30,
  },
  onboardingHeroBanner: {
    height: 180,
    backgroundColor: '#1E293B',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlayBadge: {
    alignItems: 'center',
  },
  heroOverlayText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  floatingBrandBadge: {
    position: 'absolute',
    bottom: -25,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingBrandText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#102B69',
  },
  onboardingCardBody: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  onboardingPillRow: {
    alignItems: 'center',
  },
  blueChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  blueChipText: {
    color: '#1E40AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  onboardingTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 12,
  },
  onboardingSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 4,
  },
  onboardingDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  featureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginTop: 22,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  featureBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  featureSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#94A3B8',
    marginLeft: 8,
  },
  statusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  statusTimeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  blueMainBtn: {
    backgroundColor: '#102B69',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#102B69',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  blueMainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },

  // ROLE SELECTION
  roleSelectionContent: {
    padding: 20,
    paddingBottom: 40,
  },
  roleSelectionHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  institutionCrest: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  crestTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  crestTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  crestSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  libraryBannerBox: {
    height: 120,
    backgroundColor: '#334155',
    borderRadius: 16,
    marginTop: 18,
    justifyContent: 'flex-end',
    padding: 12,
  },
  bannerBadgeOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  gatewayLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  gatewaySectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePillText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
  },
  roleGatewayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  roleGatewayIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleGatewayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleGatewayDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  roleGatewayPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  pillNote: {
    fontSize: 9,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 2,
  },
  circleChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consortiumFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  consortiumTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  consortiumSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // LOGIN
  loginContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inlineBackBtn: {
    marginBottom: 12,
  },
  inlineBackBtnText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '700',
  },
  loginBannerBox: {
    height: 100,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  loginBannerSub: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  loginBannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  loginFormBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  loginSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  inputGroup: {
    marginTop: 18,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  forgotText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#F8FAFC',
  },
  inputFieldIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  ssoInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  ssoInfoText: {
    flex: 1,
    fontSize: 10,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 14,
  },
  statusTwinBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  twinCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
  },
  twinCardLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  twinCardVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  twinCardSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  securityFooterText: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },

  // HOME
  homeContent: {
    padding: 20,
    paddingBottom: 40,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeHeaderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  homeHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  homeIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeStudentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeStudentPre: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  welcomeStudentName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  libraryOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  libraryOpenText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchBarPlaceholder: {
    color: '#94A3B8',
    fontSize: 13,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1,
  },
  sectionCampusTag: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  quickAccessTwin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  quickCardLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 10,
  },
  viewPassLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  activeReservationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activeReservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  confirmedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  resCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activeReservationBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bookCoverThumb: {
    width: 48,
    height: 60,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBookTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeBookMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeBookShelf: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '600',
    marginTop: 4,
  },
  activeReservationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  timerNotice: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  digitalIdBtn: {
    backgroundColor: '#102B69',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  digitalIdBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gatewaySwitchBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  gatewaySwitchLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  switchSmallBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
