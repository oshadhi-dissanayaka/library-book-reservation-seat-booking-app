import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { StaffHeader } from '../components/StaffHeader';
import { StaffReservationCard } from '../components/StaffReservationCard';
import { staffApi } from '../services/staffApi';
import { staffTheme } from '../theme/staffTheme';
import { Reservation } from '../types/staff.types';

interface StaffReservationManagementScreenProps {
  onSelectReservation: (reservation: Reservation) => void;
  staffId?: string;
}

type FilterTab = 'all' | 'today' | 'exceptions';

export const StaffReservationManagementScreen: React.FC<
  StaffReservationManagementScreenProps
> = ({ onSelectReservation, staffId = 'STF-4092' }) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Book' | 'Seat'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    today: 0,
    exceptions: 0,
  });
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    try {
      const res = await staffApi.getReservations(activeTab, searchQuery, typeFilter);
      if (res.success) {
        setReservations(res.data);
        setError('');
        if (res.counts) {
          setCounts({
            all: res.counts.all,
            today: res.counts.today,
            exceptions: res.counts.exceptions,
          });
        }
      } else {
        // Live mode: surface the failure instead of showing fake data.
        setReservations([]);
        setError(res.message || 'Failed to load reservations.');
      }
    } catch {
      setError('Failed to load reservations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [activeTab, searchQuery, typeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  return (
    <View style={styles.container}>
      <StaffHeader
        title="Reservations"
        subtitle="Reservation Queue & Status Control"
        staffId={staffId}
        desk="Circulation Desk 01"
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, book, seat, or student..."
            placeholderTextColor={staffTheme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs: All, Today, Exceptions */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'all' ? styles.activeTabBadge : styles.inactiveTabBadge,
            ]}>
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'all' ? styles.activeTabBadgeText : styles.inactiveTabBadgeText,
              ]}>
              {counts.all}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'today' && styles.activeTabButton]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            Today
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'today' ? styles.activeTabBadge : styles.inactiveTabBadge,
            ]}>
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'today' ? styles.activeTabBadgeText : styles.inactiveTabBadgeText,
              ]}>
              {counts.today}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'exceptions' && styles.activeTabButton]}
          onPress={() => setActiveTab('exceptions')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'exceptions' && styles.activeTabText]}>
            Exceptions
          </Text>
          <View style={[styles.tabBadge, styles.exceptionBadge]}>
            <Text style={styles.exceptionBadgeText}>{counts.exceptions}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Type Filter Chips */}
      <View style={styles.typeChipsRow}>
        <TouchableOpacity
          style={[styles.typeChip, typeFilter === 'all' && styles.activeTypeChip]}
          onPress={() => setTypeFilter('all')}>
          <Text
            style={[styles.typeChipText, typeFilter === 'all' && styles.activeTypeChipText]}>
            All Types
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeChip, typeFilter === 'Book' && styles.activeTypeChip]}
          onPress={() => setTypeFilter('Book')}>
          <Text
            style={[styles.typeChipText, typeFilter === 'Book' && styles.activeTypeChipText]}>
            Books Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeChip, typeFilter === 'Seat' && styles.activeTypeChip]}
          onPress={() => setTypeFilter('Seat')}>
          <Text
            style={[styles.typeChipText, typeFilter === 'Seat' && styles.activeTypeChipText]}>
            Seats Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reservation List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={staffTheme.navy} />
          <Text style={styles.loadingText}>Fetching reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item._id || item.reservationId}
          renderItem={({ item }) => (
            <StaffReservationCard
              reservation={item}
              onPress={() => onSelectReservation(item)}
              quickActionLabel="Manage →"
              onQuickAction={() => onSelectReservation(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No Reservations Found</Text>
              <Text style={styles.emptySub}>
                No records match the current filter and search criteria.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staffTheme.canvas,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staffTheme.white,
    borderWidth: 1.5,
    borderColor: staffTheme.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: staffTheme.ink,
  },
  clearSearch: {
    fontSize: 14,
    color: staffTheme.placeholder,
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: staffTheme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staffTheme.line,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: staffTheme.navy,
    borderColor: staffTheme.navy,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: staffTheme.muted,
  },
  activeTabText: {
    color: staffTheme.white,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  inactiveTabBadge: {
    backgroundColor: staffTheme.canvas,
  },
  activeTabBadge: {
    backgroundColor: staffTheme.navySoft,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  inactiveTabBadgeText: {
    color: staffTheme.muted,
  },
  activeTabBadgeText: {
    color: staffTheme.canvas,
  },
  exceptionBadge: {
    backgroundColor: staffTheme.paleRed,
  },
  exceptionBadgeText: {
    color: staffTheme.red,
    fontSize: 10,
    fontWeight: '800',
  },
  typeChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: staffTheme.canvas,
  },
  activeTypeChip: {
    backgroundColor: staffTheme.navy,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: staffTheme.muted,
  },
  activeTypeChipText: {
    color: staffTheme.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: staffTheme.muted,
    fontSize: 14,
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
    color: staffTheme.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: staffTheme.muted,
    textAlign: 'center',
  },
});
