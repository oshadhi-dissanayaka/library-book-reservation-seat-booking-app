import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { StaffRootNavigator } from '../../../member 3/screens/StaffRootNavigator';

export default function RoleSelectionScreen() {
  const [showStaffDirect, setShowStaffDirect] = useState(false);

  if (showStaffDirect) {
    return (
      <StaffRootNavigator
        onBackToPortal={() => setShowStaffDirect(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Institutional Header */}
        <View style={styles.header}>
          <View style={styles.crestBadge}>
            <Text style={styles.crestIcon}>🏛️</Text>
          </View>
          <Text style={styles.institutionTag}>INSTITUTIONAL PORTAL</Text>
          <Text style={styles.title}>UNIVERSITY LIBRARY</Text>
          <Text style={styles.subtitle}>
            Book Reservation & Reading-Room Seat Booking System
          </Text>
        </View>

        <View style={styles.roleSelectionBox}>
          <Text style={styles.selectionPrompt}>SELECT GATEWAY ACCESS:</Text>

          {/* Role 1: Student & Academic Staff */}
          <View style={[styles.roleCard, styles.inactiveRoleCard]}>
            <View style={styles.roleIconBox}>
              <Text style={styles.roleIcon}>🎓</Text>
            </View>
            <View style={styles.roleInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.roleTitle}>STUDENT / ACADEMIC STAFF</Text>
                <View style={styles.portalTagPill}>
                  <Text style={styles.portalTagPillText}>Student Portal</Text>
                </View>
              </View>
              <Text style={styles.roleDesc}>
                Search catalog, reserve book copies, and book reading-room study desks
              </Text>
              <View style={styles.moduleNoteRow}>
                <Text style={styles.moduleStatusNote}>Accessible via Student ID Sign-In</Text>
              </View>
            </View>
          </View>

          {/* Role 2: Library Staff */}
          <TouchableOpacity
            style={[styles.roleCard, styles.activeStaffCard]}
            onPress={() => {
              try {
                router.push('/staff' as any);
              } catch {
                setShowStaffDirect(true);
              }
            }}
            activeOpacity={0.88}>
            <View style={[styles.roleIconBox, styles.staffIconBox]}>
              <Text style={styles.roleIcon}>🏢</Text>
            </View>
            <View style={styles.roleInfo}>
              <View style={styles.staffHeaderRow}>
                <Text style={styles.staffRoleTitle}>LIBRARY STAFF</Text>
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedBadgeText}>ACTIVE TERMINAL</Text>
                </View>
              </View>
              <Text style={styles.staffRoleDesc}>
                Circulation Desk, Reservation Approvals, Book Availability, Reading Room Occupancy & No-shows
              </Text>
              <View style={styles.actionRow}>
                <View style={styles.flowStatusRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.flowStatusText}>Circulation & Desk Operations</Text>
                </View>
                <Text style={styles.enterArrow}>Enter Staff Portal →</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Role 3: University Management */}
          <View style={[styles.roleCard, styles.inactiveRoleCard]}>
            <View style={styles.roleIconBox}>
              <Text style={styles.roleIcon}>📊</Text>
            </View>
            <View style={styles.roleInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.roleTitle}>UNIVERSITY MANAGEMENT</Text>
                <View style={styles.portalTagPill}>
                  <Text style={styles.portalTagPillText}>Executive</Text>
                </View>
              </View>
              <Text style={styles.roleDesc}>
                Library analytics, usage trends & resource executive reports
              </Text>
              <View style={styles.moduleNoteRow}>
                <Text style={styles.moduleStatusNote}>Administrative & Department Reporting</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Institutional System Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerHeading}>University Library Information System</Text>
          <Text style={styles.footerSub}>
            Integrated Library Management & Learning Resource Centre
          </Text>
          <Text style={styles.footerInfo}>
            Secure Academic Network • Circulation Desk Portal v2.4
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  crestBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  crestIcon: {
    fontSize: 30,
  },
  institutionTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 360,
  },
  roleSelectionBox: {
    marginBottom: 24,
  },
  selectionPrompt: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  roleCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  inactiveRoleCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    opacity: 0.88,
  },
  activeStaffCard: {
    backgroundColor: '#1E293B',
    borderColor: '#0284C7',
    borderWidth: 2,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  staffIconBox: {
    backgroundColor: '#0284C7',
  },
  roleIcon: {
    fontSize: 24,
  },
  roleInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  portalTagPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  portalTagPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  roleDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  moduleNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  moduleStatusNote: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  staffHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffRoleTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  assignedBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assignedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  staffRoleDesc: {
    color: '#BAE6FD',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  flowStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  flowStatusText: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '600',
  },
  enterArrow: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  footerHeading: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  footerInfo: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
