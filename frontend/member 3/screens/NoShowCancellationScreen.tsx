import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ConfirmationModal } from '../components/ConfirmationModal';
import { StaffHeader } from '../components/StaffHeader';
import { StatusBadge } from '../components/StatusBadge';
import { staffApi } from '../services/staffApi';
import { NoShowsSummaryData, Reservation } from '../types/staff.types';

interface NoShowCancellationScreenProps {
  onBack: () => void;
  staffId?: string;
}

export const NoShowCancellationScreen: React.FC<NoShowCancellationScreenProps> = ({
  onBack,
  staffId = 'STF-4092',
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState<NoShowsSummaryData | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Reservation | null>(null);
  const [modalAction, setModalAction] = useState<'release' | 'resolve' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchNoShows = async () => {
    try {
      const res = await staffApi.getNoShows();
      if (res.success) {
        setSummaryData(res.data);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNoShows();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNoShows();
  };

  const handleConfirmAction = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);

    try {
      // Call staffApi markNoShow to release resources
      const res = await staffApi.markNoShow(selectedRecord.reservationId);
      if (res.success) {
        setFeedback(
          `Resource for ${selectedRecord.reservationId} has been released back to circulation.`
        );
        setTimeout(() => setFeedback(''), 4000);
        setSelectedRecord(null);
        setModalAction(null);
        fetchNoShows();
      }
    } catch {
      // Handled
    } finally {
      setActionLoading(false);
    }
  };

  const records = summaryData?.records || [];

  return (
    <View style={styles.container}>
      <StaffHeader
        title="No-show & Cancels"
        subtitle="Unclaimed Holdings & Seat Releases"
        onBack={onBack}
        showBack={true}
        staffId={staffId}
      />

      {feedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>✓ {feedback}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching no-shows and cancellations...</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id || item.reservationId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* Summary Metric Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View style={styles.counterBox}>
                    <Text style={styles.counterNum}>
                      {summaryData?.summary.todayNoShows || 3}
                    </Text>
                    <Text style={styles.counterLabel}>Today&apos;s No-shows</Text>
                  </View>
                  <View style={styles.thresholdBadge}>
                    <Text style={styles.thresholdText}>15m GRACE PERIOD</Text>
                  </View>
                </View>
                <Text style={styles.syncNote}>
                  Live sync with Central Academic Library Circulation Desk. Automatic hold expires after grace period.
                </Text>
              </View>

              <Text style={styles.sectionHeader}>RECORDS FOR REVIEW & RELEASE</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBook = item.type === 'Book';
            const title = isBook
              ? item.bookTitle || 'Book Reservation'
              : `${item.room} • ${item.seatNumber}`;

            return (
              <View style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <View style={styles.recordIdRow}>
                    <Text style={styles.recordId}>{item.reservationId}</Text>
                    <Text style={styles.typeText}>({item.type})</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.recordTitle}>{title}</Text>
                <Text style={styles.studentMeta}>
                  Student: {item.studentName} ({item.studentId})
                </Text>

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>
                    ⏱️ {item.attentionReason || 'Reserved pickup window expired. Ready to release.'}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.releaseBtn}
                    onPress={() => {
                      setSelectedRecord(item);
                      setModalAction('release');
                    }}
                    activeOpacity={0.7}>
                    <Text style={styles.releaseBtnText}>Release Resource</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>No Pending No-shows</Text>
              <Text style={styles.emptySub}>
                All expired bookings and student cancellations have been cleared.
              </Text>
            </View>
          }
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={!!selectedRecord && !!modalAction}
        title="Release Reserved Resource?"
        message={`Confirm resource release for ${selectedRecord?.reservationId} (${selectedRecord?.studentName})? The copy or seat will be returned to the available pool.`}
        confirmLabel="Release to Pool"
        isDestructive={false}
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setSelectedRecord(null);
          setModalAction(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  feedbackBanner: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
  },
  feedbackText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  counterNum: {
    color: '#DC2626',
    fontSize: 32,
    fontWeight: '900',
  },
  counterLabel: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  thresholdBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  thresholdText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncNote: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordId: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  typeText: {
    color: '#64748B',
    fontSize: 12,
  },
  recordTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  studentMeta: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 8,
  },
  reasonBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  releaseBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  releaseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
