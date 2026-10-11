import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { StaffHeader } from '../components/StaffHeader';
import { StaffMetricCard } from '../components/StaffMetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { staffApi } from '../services/staffApi';
import { staffTheme } from '../theme/staffTheme';
import { Reservation, StaffDashboardData } from '../types/staff.types';

interface StaffDashboardScreenProps {
  onNavigateReservations: () => void;
  onNavigateBooks: () => void;
  onNavigateRoom: () => void;
  onNavigateNoShows: () => void;
  onSelectReservation: (reservation: Reservation) => void;
  onBackToPortal?: () => void;
  staffId?: string;
}

export const StaffDashboardScreen: React.FC<StaffDashboardScreenProps> = ({
  onNavigateReservations,
  onNavigateBooks,
  onNavigateRoom,
  onNavigateNoShows,
  onSelectReservation,
  onBackToPortal,
  staffId = 'STF-4092',
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      const res = await staffApi.getDashboard();
      if (res.success) {
        setData(res.data);
        setError('');
      } else {
        setError(res.message || 'Failed to load the staff dashboard.');
      }
    } catch {
      setError('Failed to load the staff dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Real zeros when the dashboard has not loaded yet — no demo numbers.
  const metrics = data?.metrics || {
    reservationsToday: 0,
    attentionRequired: 0,
    occupiedSeats: 0,
    totalSeats: 0,
  };

  const attentionList = data?.requiresAttention || [];

  return (
    <View style={styles.container}>
      <StaffHeader
        title="Staff Dashboard"
        subtitle="Operations & Resource Overview"
        staffId={staffId}
        desk="Circulation Desk 01"
        showBack={!!onBackToPortal}
        onBack={onBackToPortal}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={staffTheme.navy} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Top Metric Cards */}
          <View style={styles.metricsRow}>
            <StaffMetricCard
              label="Reservations Today"
              value={metrics.reservationsToday}
              onPress={onNavigateReservations}
              accentColor={staffTheme.navy}
            />
            <StaffMetricCard
              label="Attention Required"
              value={metrics.attentionRequired}
              alert={metrics.attentionRequired > 0}
              onPress={onNavigateReservations}
              accentColor={staffTheme.red}
            />
            <StaffMetricCard
              label="Occupied Seats"
              value={`${metrics.occupiedSeats}/${metrics.totalSeats}`}
              onPress={onNavigateRoom}
              accentColor={staffTheme.green}
            />
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateReservations}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: staffTheme.paleBlue }]}>
                <SymbolView
                  name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                  tintColor={staffTheme.blue}
                  size={18}
                />
              </View>
              <Text style={styles.actionTitle}>Reservations</Text>
              <Text style={styles.actionSub}>Manage active queues</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateBooks}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: staffTheme.paleGreen }]}>
                <SymbolView
                  name={{ ios: 'book.closed', android: 'menu_book', web: 'menu_book' }}
                  tintColor={staffTheme.green}
                  size={18}
                />
              </View>
              <Text style={styles.actionTitle}>Books</Text>
              <Text style={styles.actionSub}>Availability & catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateRoom}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: staffTheme.paleAmber }]}>
                <SymbolView
                  name={{ ios: 'building.2', android: 'account_balance', web: 'account_balance' }}
                  tintColor={staffTheme.amber}
                  size={18}
                />
              </View>
              <Text style={styles.actionTitle}>Reading Room</Text>
              <Text style={styles.actionSub}>Live floor occupancy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateNoShows}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: staffTheme.paleRed }]}>
                <SymbolView
                  name={{ ios: 'timer', android: 'timer', web: 'timer' }}
                  tintColor={staffTheme.red}
                  size={18}
                />
              </View>
              <Text style={styles.actionTitle}>No-shows</Text>
              <Text style={styles.actionSub}>Releases & cancels</Text>
            </TouchableOpacity>
          </View>

          {/* Requires Attention Section */}
          <View style={styles.attentionHeaderRow}>
            <View style={styles.attentionTitleRow}>
              <Text style={styles.sectionTitle}>REQUIRES ATTENTION</Text>
              <View style={styles.alertCounter}>
                <Text style={styles.alertCounterText}>
                  {attentionList.length} items
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onNavigateReservations} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {attentionList.map((item) => (
            <View key={item._id || item.reservationId} style={styles.attentionCard}>
              <View style={styles.attentionCardTop}>
                <View style={styles.attentionIdRow}>
                  <Text style={styles.attentionId}>{item.reservationId}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.attentionBookTitle}>{item.bookTitle}</Text>
                <Text style={styles.attentionStudent}>
                  Student: {item.studentName} ({item.studentId})
                </Text>
                <Text style={styles.attentionReason}>
                  ⚠️ {item.attentionReason || 'Requires immediate review before issuance.'}
                </Text>
              </View>

              <View style={styles.attentionActionsRow}>
                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={() => onSelectReservation(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.inspectBtnText}>Inspect Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => onSelectReservation(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.resolveBtnText}>Manage Action →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Operational Shift Information */}
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                tintColor={staffTheme.navy}
                size={16}
              />
              <Text style={styles.shiftTitle}>Main Library Circulation Desk 01</Text>
            </View>
            <Text style={styles.shiftDetail}>
              Regular Shift: 08:00 - 17:00 | Handover: 14:00 | Active Staff: {staffId}
            </Text>
            <Text style={styles.shiftSub}>
              System synchronized with Central Academic Library Network.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staffTheme.canvas,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: staffTheme.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: staffTheme.paleRed,
    borderColor: staffTheme.redLine,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: staffTheme.red,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: staffTheme.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: staffTheme.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: staffTheme.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    color: staffTheme.muted,
    fontSize: 11,
    marginTop: 2,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attentionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertCounter: {
    backgroundColor: staffTheme.paleRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  alertCounterText: {
    color: staffTheme.red,
    fontSize: 10,
    fontWeight: '800',
  },
  viewAllText: {
    color: staffTheme.navy,
    fontSize: 12,
    fontWeight: '700',
  },
  attentionCard: {
    backgroundColor: staffTheme.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staffTheme.redLine,
    borderLeftWidth: 5,
    borderLeftColor: staffTheme.red,
  },
  attentionCardTop: {
    marginBottom: 12,
  },
  attentionIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attentionId: {
    color: staffTheme.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  attentionBookTitle: {
    color: staffTheme.ink,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  attentionStudent: {
    color: staffTheme.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  attentionReason: {
    color: staffTheme.red,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: staffTheme.paleRed,
    padding: 8,
    borderRadius: 8,
  },
  attentionActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: staffTheme.canvas,
    paddingTop: 10,
  },
  inspectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: staffTheme.canvas,
  },
  inspectBtnText: {
    color: staffTheme.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  resolveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: staffTheme.navy,
  },
  resolveBtnText: {
    color: staffTheme.white,
    fontSize: 12,
    fontWeight: '700',
  },
  shiftCard: {
    backgroundColor: staffTheme.paleBlue,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: staffTheme.navyTint,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  shiftTitle: {
    color: staffTheme.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  shiftDetail: {
    color: staffTheme.blue,
    fontSize: 12,
    fontWeight: '600',
  },
  shiftSub: {
    color: staffTheme.muted,
    fontSize: 11,
    marginTop: 4,
  },
});
