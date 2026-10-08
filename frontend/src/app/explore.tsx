import { Link, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Reservation, reservationsApi } from '@/lib/api';
import { formatDateTime, formatPickupDate, getPickupDateOptions } from '@/lib/dates';

const palette = {
  ink: '#17243f',
  muted: '#66738a',
  navy: '#102b69',
  blue: '#2456b3',
  canvas: '#f4f6fb',
  line: '#e5e9f1',
  white: '#ffffff',
  paleBlue: '#eaf0fc',
  green: '#16875b',
  paleGreen: '#e8f6ef',
  red: '#b33535',
  paleRed: '#fff0ef',
};

const pickupDates = getPickupDateOptions();
const dateFilterOptions = [
  { value: 'all', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'next7', label: 'Next 7 days' },
  { value: 'past', label: 'Past pickup' },
] as const;

type ReservationDateFilter = (typeof dateFilterOptions)[number]['value'];

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function ReservationsScreen() {
  const params = useLocalSearchParams<{ patronId?: string }>();
  const linkedPatronId = Array.isArray(params.patronId) ? params.patronId[0] : params.patronId;
  const [patronId, setPatronId] = useState(linkedPatronId || '');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [dateFilter, setDateFilter] = useState<ReservationDateFilter>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');

  const findReservations = async (id = patronId, isRefresh = false) => {
    const normalizedId = id.trim().toUpperCase();
    if (normalizedId.length < 3) {
      setError('Enter a valid student or library ID.');
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = await reservationsApi.list(normalizedId);
      setPatronId(normalizedId);
      setReservations(result.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load reservations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (linkedPatronId) void findReservations(linkedPatronId);
  }, [linkedPatronId]);

  const activeReservations = reservations.filter((item) => item.status === 'confirmed');
  const pastReservations = reservations.filter((item) => item.status !== 'confirmed');
  const statusReservations = activeTab === 'active' ? activeReservations : pastReservations;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = getDateKey(today);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekKey = getDateKey(nextWeek);
  const visibleReservations = statusReservations.filter((reservation) => {
    const pickupKey = reservation.pickupDate?.slice(0, 10) || '';
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && pickupKey === todayKey) ||
      (dateFilter === 'next7' && pickupKey >= todayKey && pickupKey <= nextWeekKey) ||
      (dateFilter === 'past' && pickupKey < todayKey);

    return matchesDate;
  });
  const hasReservationFilters = dateFilter !== 'all';

  const beginEdit = (reservation: Reservation) => {
    setEditingId(reservation._id);
    setEditDate(reservation.pickupDate.slice(0, 10));
    setEditTime(reservation.pickupTime || '09:00');
    setError('');
  };

  const savePickupDate = async (reservation: Reservation) => {
    setSavingId(reservation._id);
    setError('');
    try {
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(editTime)) {
        setError('Choose a pickup time in HH:MM format.');
        return;
      }

      const updated = await reservationsApi.update(reservation._id, {
        patronId: patronId.trim().toUpperCase(),
        pickupDate: editDate,
        pickupTime: editTime,
      });
      setReservations((items) => items.map((item) => item._id === updated._id ? updated : item));
      setEditingId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update this reservation.');
    } finally {
      setSavingId(null);
    }
  };

  const cancelReservation = async (reservation: Reservation) => {
    setSavingId(reservation._id);
    setError('');
    try {
      await reservationsApi.cancel(reservation._id, patronId.trim().toUpperCase());
      setReservations((items) => items.map((item) => item._id === reservation._id ? { ...item, status: 'cancelled' } : item));
      setCancelId(null);
      setEditingId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to cancel this reservation.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void findReservations(patronId, true)} tintColor={palette.navy} />}>
        <View style={styles.topBar}>
          <Link href="/" asChild>
            <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Back to book catalog">
              <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={palette.navy} size={17} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>UNIVERSITY LIBRARY</Text>
            <Text style={styles.title}>My reservations</Text>
          </View>
          <View style={styles.headerIcon}><SymbolView name={{ ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }} tintColor={palette.white} size={17} /></View>
        </View>

        <View style={styles.lookupPanel}>
          <Text style={styles.lookupTitle}>Find your reservations</Text>
          <Text style={styles.lookupCopy}>Use the student or library ID entered when you reserved.</Text>
          <View style={styles.lookupForm}>
            <TextInput
              accessibilityLabel="Student or library ID"
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={setPatronId}
              onSubmitEditing={() => void findReservations()}
              placeholder="Student / library ID"
              placeholderTextColor="#8792a5"
              returnKeyType="search"
              style={styles.lookupInput}
              value={patronId}
            />
            <Pressable onPress={() => void findReservations()} disabled={loading} style={({ pressed }) => [styles.lookupButton, pressed && styles.pressed]} accessibilityRole="button">
              {loading ? <ActivityIndicator color={palette.white} size="small" /> : <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={palette.white} size={16} />}
              <Text style={styles.lookupButtonText}>{loading ? 'Loading' : 'Find'}</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {searched && !loading && !error && (
          <>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Book reservations</Text>
                <Text style={styles.resultCount}>
                  {hasReservationFilters
                    ? `${visibleReservations.length} of ${reservations.length} records`
                    : `${reservations.length} ${reservations.length === 1 ? 'record' : 'records'}`}
                </Text>
              </View>
              <View style={styles.activeIndicator}><View style={styles.liveDot} /><Text style={styles.activeIndicatorText}>LIVE</Text></View>
            </View>

            <View style={styles.tabs}>
              <Pressable onPress={() => setActiveTab('active')} style={[styles.tab, activeTab === 'active' && styles.tabSelected]} accessibilityRole="button" accessibilityState={{ selected: activeTab === 'active' }}>
                <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextSelected]}>Active</Text>
                <Text style={[styles.tabCount, activeTab === 'active' && styles.tabCountSelected]}>{activeReservations.length}</Text>
              </Pressable>
              <Pressable onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && styles.tabSelected]} accessibilityRole="button" accessibilityState={{ selected: activeTab === 'history' }}>
                <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextSelected]}>History</Text>
                <Text style={[styles.tabCount, activeTab === 'history' && styles.tabCountSelected]}>{pastReservations.length}</Text>
              </Pressable>
            </View>

            <View style={styles.resultFilters}>
              <Text style={styles.filterCaption}>FILTER BY PICKUP DATE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateFilters}>
                {dateFilterOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setDateFilter(option.value)}
                    style={({ pressed }) => [styles.dateFilterChip, dateFilter === option.value && styles.dateFilterChipSelected, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dateFilter === option.value }}>
                    <Text style={[styles.dateFilterText, dateFilter === option.value && styles.dateFilterTextSelected]}>{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {visibleReservations.length === 0 ? (
              <View style={styles.emptyPanel}>
                <View style={styles.emptyIcon}><SymbolView name={{ ios: hasReservationFilters ? 'line.3.horizontal.decrease.circle' : activeTab === 'active' ? 'bookmark' : 'clock.arrow.circlepath', android: hasReservationFilters ? 'filter_alt' : activeTab === 'active' ? 'bookmark_border' : 'history', web: hasReservationFilters ? 'filter_alt' : activeTab === 'active' ? 'bookmark_border' : 'history' }} tintColor={palette.navy} size={21} /></View>
                <Text style={styles.emptyTitle}>{hasReservationFilters ? 'No matching reservations' : activeTab === 'active' ? 'No active reservations' : 'No reservation history'}</Text>
                <Text style={styles.emptyCopy}>{hasReservationFilters ? 'No reservations match this pickup date.' : activeTab === 'active' ? 'Find a title in the catalog and reserve an available copy.' : 'Completed, cancelled, or expired book reservations will appear here.'}</Text>
                {hasReservationFilters ? (
                  <Pressable onPress={() => setDateFilter('all')} style={({ pressed }) => [styles.clearFiltersButton, pressed && styles.pressed]} accessibilityRole="button">
                    <Text style={styles.clearFiltersText}>Show any date</Text>
                  </Pressable>
                ) : activeTab === 'active' ? (
                  <Link href="/" asChild><Pressable style={({ pressed }) => [styles.catalogButton, pressed && styles.pressed]}><Text style={styles.catalogButtonText}>Browse catalog</Text><SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor={palette.white} size={15} /></Pressable></Link>
                ) : null}
              </View>
            ) : (
              <View style={styles.reservationList}>
                {visibleReservations.map((reservation) => {
                  const book = reservation.bookId;
                  const isActive = reservation.status === 'confirmed';
                  const isSaving = savingId === reservation._id;
                  return (
                    <View key={reservation._id} style={styles.card}>
                      <View style={styles.cardTop}>
                        <View style={[styles.cardCover, !isActive && styles.cardCoverMuted]}><SymbolView name={{ ios: 'books.vertical.fill', android: 'menu_book', web: 'menu_book' }} tintColor={palette.white} size={22} /></View>
                        <View style={styles.cardTitleGroup}>
                          <Text style={styles.cardCategory} numberOfLines={1}>{book?.category || 'BOOK RESERVATION'}</Text>
                          <Text style={styles.cardTitle} numberOfLines={2}>{book?.title || 'Catalog title unavailable'}</Text>
                          <Text style={styles.cardAuthor} numberOfLines={1}>{book?.author || 'Library archive'}</Text>
                        </View>
                        <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusPast]}>
                          <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextPast]}>{reservation.status}</Text>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />
                      <View style={styles.infoRow}>
                        <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} tintColor={palette.navy} size={15} />
                        <Text style={styles.infoLabel}>Pickup date</Text>
                        <Text style={styles.infoValue}>{formatPickupDate(reservation.pickupDate)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} tintColor={palette.navy} size={15} />
                        <Text style={styles.infoLabel}>Pickup time</Text>
                        <Text style={styles.infoValue}>{reservation.pickupTime || '09:00'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={palette.navy} size={15} />
                        <Text style={styles.infoLabel}>Pickup location</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{reservation.pickupLocation}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} tintColor={palette.muted} size={14} />
                        <Text style={styles.infoLabel}>{isActive ? 'Reservation expires' : 'Reserved'}</Text>
                        <Text style={styles.infoValue}>{formatDateTime(isActive ? reservation.holdExpiresAt : reservation.createdAt)}</Text>
                      </View>

                      {isActive && editingId === reservation._id ? (
                        <View style={styles.editPanel}>
                          <Text style={styles.editLabel}>CHOOSE A NEW PICKUP DATE</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateOptions}>
                            {pickupDates.map((option) => (
                              <Pressable key={option.value} onPress={() => setEditDate(option.value)} style={[styles.dateOption, editDate === option.value && styles.dateOptionSelected]} accessibilityRole="button" accessibilityState={{ selected: editDate === option.value }}>
                                <Text style={[styles.dateOptionDay, editDate === option.value && styles.dateOptionTextSelected]}>{option.label}</Text>
                                <Text style={[styles.dateOptionDate, editDate === option.value && styles.dateOptionTextSelected]}>{option.day}</Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                          <TextInput
                            accessibilityLabel="Pickup time"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="numbers-and-punctuation"
                            onChangeText={setEditTime}
                            placeholder="HH:MM"
                            placeholderTextColor="#8792a5"
                            style={styles.editTimeInput}
                            value={editTime}
                          />
                          <View style={styles.actionRow}>
                            <Pressable onPress={() => setEditingId(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Keep date</Text></Pressable>
                            <Pressable onPress={() => void savePickupDate(reservation)} disabled={isSaving} style={[styles.smallPrimaryButton, isSaving && styles.disabledButton]}>
                              {isSaving ? <ActivityIndicator color={palette.white} size="small" /> : null}
                              <Text style={styles.smallPrimaryButtonText}>{isSaving ? 'Saving' : 'Save date'}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : null}

                      {isActive && cancelId === reservation._id ? (
                        <View style={styles.cancelPanel}>
                          <Text style={styles.cancelPrompt}>Cancel this reservation? The copy will be released to the catalog.</Text>
                          <View style={styles.actionRow}>
                            <Pressable onPress={() => setCancelId(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Keep reservation</Text></Pressable>
                            <Pressable onPress={() => void cancelReservation(reservation)} disabled={isSaving} style={[styles.cancelConfirmButton, isSaving && styles.disabledButton]}>
                              {isSaving ? <ActivityIndicator color={palette.white} size="small" /> : null}
                              <Text style={styles.cancelConfirmText}>{isSaving ? 'Cancelling' : 'Cancel reservation'}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : null}

                      {isActive && editingId !== reservation._id && cancelId !== reservation._id && (
                        <View style={styles.actions}>
                          <Pressable onPress={() => beginEdit(reservation)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="button">
                            <SymbolView name={{ ios: 'calendar', android: 'edit_calendar', web: 'edit_calendar' }} tintColor={palette.navy} size={14} />
                            <Text style={styles.secondaryButtonText}>Change pickup date</Text>
                          </Pressable>
                          <Pressable onPress={() => setCancelId(reservation._id)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Cancel reservation">
                            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={palette.red} size={15} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {!searched && !loading && (
          <View style={styles.hintPanel}>
            <SymbolView name={{ ios: 'lock.shield', android: 'verified_user', web: 'verified_user' }} tintColor={palette.navy} size={20} />
            <Text style={styles.hintText}>Your reservations are looked up using the student or library ID entered when reserving.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  topBar: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 37, height: 37, borderRadius: 10, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  eyebrow: { color: palette.blue, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 21, fontWeight: '800', marginTop: 3 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  lookupPanel: { padding: 16, marginTop: 15, borderRadius: 14, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  lookupTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  lookupCopy: { color: palette.muted, fontSize: 11, marginTop: 4 },
  lookupForm: { flexDirection: 'row', gap: 8, marginTop: 13 },
  lookupInput: { flex: 1, minWidth: 0, height: 43, paddingHorizontal: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 8, color: palette.ink, backgroundColor: '#fbfcfe', fontSize: 12 },
  lookupButton: { width: 92, minHeight: 43, borderRadius: 8, backgroundColor: palette.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  lookupButtonText: { color: palette.white, fontSize: 12, fontWeight: '800' },
  errorPanel: { paddingHorizontal: 13, paddingVertical: 11, marginTop: 11, borderRadius: 9, backgroundColor: palette.paleRed },
  errorText: { color: palette.red, fontSize: 11, lineHeight: 16 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  resultCount: { color: palette.muted, fontSize: 10, marginTop: 3 },
  activeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: palette.paleGreen },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.green },
  activeIndicatorText: { color: palette.green, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  tabs: { flexDirection: 'row', padding: 3, gap: 3, marginTop: 14, borderRadius: 10, backgroundColor: '#e9edf5' },
  tab: { flex: 1, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 8 },
  tabSelected: { backgroundColor: palette.white },
  tabText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  tabTextSelected: { color: palette.navy },
  tabCount: { color: palette.muted, fontSize: 9, fontWeight: '800' },
  tabCountSelected: { color: palette.navy },
  resultFilters: { gap: 9, marginTop: 13 },
  filterCaption: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6, marginTop: 2 },
  dateFilters: { gap: 6 },
  dateFilterChip: { minHeight: 31, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.white },
  dateFilterChipSelected: { borderColor: palette.navy, backgroundColor: palette.navy },
  dateFilterText: { color: palette.muted, fontSize: 9, fontWeight: '700' },
  dateFilterTextSelected: { color: palette.white },
  reservationList: { gap: 11, marginTop: 11 },
  card: { padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  cardCover: { width: 53, height: 66, borderRadius: 7, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  cardCoverMuted: { backgroundColor: '#8993a5' },
  cardTitleGroup: { flex: 1, minWidth: 0 },
  cardCategory: { color: palette.blue, fontSize: 8, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  cardTitle: { color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: '800', marginTop: 4 },
  cardAuthor: { color: palette.muted, fontSize: 10, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, alignSelf: 'flex-start' },
  statusActive: { backgroundColor: palette.paleGreen },
  statusPast: { backgroundColor: '#eef0f4' },
  statusText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  statusTextActive: { color: palette.green },
  statusTextPast: { color: palette.muted },
  cardDivider: { height: 1, backgroundColor: palette.line, marginVertical: 12 },
  infoRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { flex: 1, color: palette.muted, fontSize: 10 },
  infoValue: { maxWidth: '53%', color: palette.ink, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: palette.line },
  secondaryButton: { minHeight: 36, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white },
  secondaryButtonText: { color: palette.navy, fontSize: 10, fontWeight: '700' },
  cancelButton: { width: 36, height: 36, marginLeft: 'auto', borderRadius: 8, borderWidth: 1, borderColor: '#f1d6d4', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.white },
  editPanel: { gap: 9, padding: 10, marginTop: 10, borderRadius: 9, backgroundColor: '#f6f8fc' },
  editLabel: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  dateOptions: { gap: 6, paddingVertical: 2 },
  dateOption: { minWidth: 61, minHeight: 49, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.white },
  dateOptionSelected: { borderColor: palette.navy, backgroundColor: palette.navy },
  dateOptionDay: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  dateOptionDate: { color: palette.ink, fontSize: 10, fontWeight: '800', marginTop: 3 },
  dateOptionTextSelected: { color: palette.white },
  editTimeInput: { minHeight: 40, paddingHorizontal: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.white, color: palette.ink, fontSize: 11 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  smallPrimaryButton: { minWidth: 94, minHeight: 36, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: palette.navy },
  smallPrimaryButtonText: { color: palette.white, fontSize: 10, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  cancelPanel: { gap: 8, padding: 10, marginTop: 10, borderRadius: 9, backgroundColor: palette.paleRed },
  cancelPrompt: { color: palette.ink, fontSize: 10, lineHeight: 15 },
  cancelConfirmButton: { minWidth: 102, minHeight: 36, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: palette.red },
  cancelConfirmText: { color: palette.white, fontSize: 10, fontWeight: '800' },
  emptyPanel: { minHeight: 220, marginTop: 11, paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white },
  emptyIcon: { width: 47, height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paleBlue },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 11 },
  emptyCopy: { maxWidth: 285, color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  clearFiltersButton: { minHeight: 36, paddingHorizontal: 12, marginTop: 11, justifyContent: 'center', borderRadius: 8, backgroundColor: palette.paleBlue },
  clearFiltersText: { color: palette.navy, fontSize: 10, fontWeight: '800' },
  catalogButton: { minHeight: 40, paddingHorizontal: 13, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, backgroundColor: palette.navy },
  catalogButtonText: { color: palette.white, fontSize: 11, fontWeight: '800' },
  hintPanel: { minHeight: 65, padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center', marginTop: 15, borderRadius: 10, backgroundColor: palette.paleBlue },
  hintText: { flex: 1, color: palette.navy, fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.76 },
});
