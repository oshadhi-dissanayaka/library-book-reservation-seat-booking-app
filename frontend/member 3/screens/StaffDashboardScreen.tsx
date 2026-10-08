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

  const loadDashboard = async () => {
    try {
      const res = await staffApi.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch {
      // Handled by service fallbacks
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

  const metrics = data?.metrics || {
    reservationsToday: 24,
    attentionRequired: 3,
    occupiedSeats: 18,
    totalSeats: 30,
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
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
              accentColor="#2563EB"
            />
            <StaffMetricCard
              label="Attention Required"
              value={metrics.attentionRequired}
              alert={metrics.attentionRequired > 0}
              onPress={onNavigateReservations}
              accentColor="#EF4444"
            />
            <StaffMetricCard
              label="Occupied Seats"
              value={`${metrics.occupiedSeats}/${metrics.totalSeats}`}
              onPress={onNavigateRoom}
              accentColor="#10B981"
            />
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateReservations}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.actionIcon}>📋</Text>
              </View>
              <Text style={styles.actionTitle}>Reservations</Text>
              <Text style={styles.actionSub}>Manage active queues</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateBooks}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.actionIcon}>📚</Text>
              </View>
              <Text style={styles.actionTitle}>Books</Text>
              <Text style={styles.actionSub}>Availability & catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateRoom}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.actionIcon}>🏛️</Text>
              </View>
              <Text style={styles.actionTitle}>Reading Room</Text>
              <Text style={styles.actionSub}>Live floor occupancy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateNoShows}
              activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.actionIcon}>⏱️</Text>
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
              <Text style={styles.shiftIcon}>🕒</Text>
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
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
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
    color: '#475569',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  actionIcon: {
    fontSize: 18,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    color: '#94A3B8',
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
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  alertCounterText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
  },
  viewAllText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  attentionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
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
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  attentionBookTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  attentionStudent: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 6,
  },
  attentionReason: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
  },
  attentionActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  inspectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  inspectBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  resolveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  shiftCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  shiftIcon: {
    fontSize: 16,
  },
  shiftTitle: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '700',
  },
  shiftDetail: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  shiftSub: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
});
