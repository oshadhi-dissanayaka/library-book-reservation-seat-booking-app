import { router, useFocusEffect, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LibConnectMark } from '@/components/libconnect-mark';
import { Brand, greetingForHour } from '@/constants/brand';
import { API_ORIGIN, Reservation, reservationsApi } from '@/lib/api';
import {
  PortalSession,
  getPortalSession,
  portalBackendId,
} from '@/lib/portal-session';

/**
 * Authenticated Student / Academic Staff Home (route "/home", first tab).
 *
 * Sections: header, greeting + library status, search entry, quick access,
 * and ONE nearest upcoming active reservation (seat or book).
 *
 * Data is read-only and reuses the existing endpoints:
 *   GET /api/reading-rooms                  -> room hours (library status)
 *   GET /api/seat-reservations?studentId=.. -> this student's seat bookings
 *   GET /api/reservations?patronId=..       -> this patron's book bookings
 * No reservation logic is duplicated here — Home only lists summaries and
 * navigates into the existing flows.
 */

type SeatReservation = {
  _id: string;
  readingRoom: string;
  date: string;
  time: string;
  seatNumber: number;
  status: string;
};

type RoomInfo = {
  _id: string;
  name: string;
  openingTime: string;
  closingTime: string;
};

type LibraryStatus = { kind: 'open' | 'closed' | 'neutral'; label: string };

type ActiveItem =
  | { kind: 'seat'; reservation: SeatReservation; roomName: string; sortKey: string }
  | { kind: 'book'; reservation: Reservation; sortKey: string };

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-10-16" -> "16 October 2026" (same helper style as WF-13). */
function formatIsoDate(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const monthIndex = Number(parts[1]) - 1;
  if (!MONTH_NAMES[monthIndex]) return value;
  return `${Number(parts[2])} ${MONTH_NAMES[monthIndex]} ${parts[0]}`;
}

function seatConfirmationCode(id: string): string {
  return `RES-SEAT-${id.slice(-4).toUpperCase()}`;
}

/** "08:30" -> "08:30 AM" (24h backend strings). */
function formatTime12(value: string): string {
  const [hourString, minute] = value.split(':');
  if (!hourString || !minute) return value;
  const hour = Number(hourString);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/** Derive open/closed ONLY from the configured reading-room hours. */
function deriveLibraryStatus(rooms: RoomInfo[]): LibraryStatus {
  if (rooms.length === 0) return { kind: 'neutral', label: 'Library Services' };
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const within = (value: string): number | null => {
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const open = rooms.some((room) => {
    const opens = within(room.openingTime);
    const closes = within(room.closingTime);
    if (opens === null || closes === null) return false;
    return minutes >= opens && minutes <= closes;
  });
  return open
    ? { kind: 'open', label: 'Library Open' }
    : { kind: 'closed', label: 'Library Closed' };
}

export default function StudentHomeScreen() {
  const pathname = usePathname();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LibraryStatus>({ kind: 'neutral', label: 'Library Services' });
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHome = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    const backendId = portalBackendId();
    const today = todayIso();

    // 1. Library hours (best effort — status degrades to a neutral label).
    let rooms: RoomInfo[] = [];
    try {
      const roomsResponse = await fetch(`${API_ORIGIN}/api/reading-rooms`);
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        if (Array.isArray(roomsData.readingRooms)) rooms = roomsData.readingRooms;
      }
      setStatus(deriveLibraryStatus(rooms));
    } catch {
      setStatus({ kind: 'neutral', label: 'Library Services' });
    }

    // 2. Nearest upcoming active reservation (seat list + book list).
    try {
      const seatCandidates: ActiveItem[] = [];
      try {
        const seatResponse = await fetch(
          `${API_ORIGIN}/api/seat-reservations?studentId=${encodeURIComponent(backendId)}`
        );
        if (seatResponse.ok) {
          const seatData = await seatResponse.json();
          const seats: SeatReservation[] = Array.isArray(seatData.reservations)
            ? seatData.reservations
            : [];
          for (const reservation of seats) {
            if (reservation.status !== 'active' || reservation.date < today) continue;
            const roomName =
              rooms.find((room) => room._id === reservation.readingRoom)?.name ??
              'Reading Room';
            seatCandidates.push({
              kind: 'seat',
              reservation,
              roomName,
              sortKey: `${reservation.date}T${reservation.time || '00:00'}`,
            });
          }
        }
      } catch {
        // Seat list is best effort on Home.
      }

      const bookCandidates: ActiveItem[] = [];
      try {
        const bookResult = await reservationsApi.list(backendId);
        for (const reservation of bookResult.items) {
          if (reservation.status !== 'confirmed') continue;
          if (reservation.pickupDate && reservation.pickupDate < today) continue;
          bookCandidates.push({
            kind: 'book',
            reservation,
            sortKey: `${reservation.pickupDate ?? ''}T${reservation.pickupTime ?? '00:00'}`,
          });
        }
      } catch {
        // Book list is best effort on Home.
      }

      const all = [...seatCandidates, ...bookCandidates].sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey)
      );
      setActiveItem(all[0] ?? null);
    } catch {
      setError('Unable to load your reservations right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever Home regains focus (e.g. after cancelling on WF-14).
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      void getPortalSession().then((value) => {
        if (mounted) setSession(value);
      });
      void loadHome();
      return () => {
        mounted = false;
      };
    }, [loadHome])
  );

  const submitSearch = () => {
    const query = search.trim();
    router.push({ pathname: '/books', params: query ? { q: query } : {} });
  };

  const displayName = session?.displayName?.trim() || 'Student';

  return (
    <View style={styles.screen}>
      {pathname === '/home' && <StatusBar style="dark" />}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LibConnectMark size={34} />
            <Text style={styles.headerTitle}>Home</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={6}
              onPress={() => router.push('/notifications')}
              cssInterop={false}
              style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
                tintColor={Brand.navy}
                size={21}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={6}
              onPress={() => router.push('/profile')}
              cssInterop={false}
              style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
                tintColor={Brand.navy}
                size={21}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadHome(true)} tintColor={Brand.navy} />
          }>
          {/* Greeting */}
          <Text style={styles.welcomeEyebrow}>WELCOME BACK</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>
              {greetingForHour(new Date().getHours())}, {displayName}
            </Text>
            <View
              style={[
                styles.statusPill,
                status.kind === 'open' && styles.statusPillOpen,
                status.kind === 'closed' && styles.statusPillClosed,
              ]}>
              <View
                style={[
                  styles.statusDot,
                  status.kind === 'open' && styles.statusDotOpen,
                  status.kind === 'closed' && styles.statusDotClosed,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  status.kind === 'open' && styles.statusTextOpen,
                  status.kind === 'closed' && styles.statusTextClosed,
                ]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Search entry point */}
          <View style={styles.searchBox}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              tintColor={Brand.muted}
              size={18}
            />
            <TextInput
              accessibilityLabel="Search books, authors, ISBN"
              autoCapitalize="none"
              onChangeText={setSearch}
              onSubmitEditing={submitSearch}
              placeholder="Search books, authors, ISBN"
              placeholderTextColor="#8792a5"
              returnKeyType="search"
              selectionColor={Brand.muted}
              style={styles.searchInput}
              value={search}
            />
          </View>

          {/* Quick access */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Books — search and reserve"
              onPress={() => router.push('/books')}
              style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
              <View style={styles.quickIcon}>
                <SymbolView
                  name={{ ios: 'book', android: 'menu_book', web: 'menu_book' }}
                  tintColor={Brand.blue}
                  size={22}
                />
              </View>
              <Text style={styles.quickTitle}>Books</Text>
              <Text style={styles.quickCopy}>Search &amp; Reserve</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reading Room — seat availability"
              onPress={() => router.push('/reading-rooms')}
              style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
              <View style={styles.quickIcon}>
                <SymbolView
                  name={{ ios: 'chair.lounge', android: 'event_seat', web: 'event_seat' }}
                  tintColor={Brand.blue}
                  size={22}
                />
              </View>
              <Text style={styles.quickTitle}>Reading Room</Text>
              <Text style={styles.quickCopy}>Seat Availability</Text>
            </Pressable>
          </View>

          {/* Active reservation */}
          <Text style={styles.sectionTitle}>Active Reservation</Text>
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={Brand.blue} />
            </View>
          ) : activeItem ? (
            activeItem.kind === 'seat' ? (
              <SeatActiveCard item={activeItem} />
            ) : (
              <BookActiveCard item={activeItem} />
            )
          ) : (
            <View style={styles.stateCard}>
              <SymbolView
                name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
                tintColor={Brand.muted}
                size={26}
              />
              <Text style={styles.emptyTitle}>No active reservations</Text>
              <Text style={styles.emptyCopy}>
                Reserve a book or book a reading-room seat to see it here.
              </Text>
              <View style={styles.emptyActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/books')}
                  style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
                  <Text style={styles.emptyButtonText}>Browse Books</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/reading-rooms')}
                  style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
                  <Text style={styles.emptyButtonText}>Reserve a Seat</Text>
                </Pressable>
              </View>
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

function SeatActiveCard({ item }: { item: Extract<ActiveItem, { kind: 'seat' }> }) {
  const { reservation, roomName } = item;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open seat reservation details"
      onPress={() => router.push({ pathname: '/reservations/[id]', params: { id: reservation._id } })}
      style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}>
      <View style={styles.activeCardHeader}>
        <View style={styles.statusTag}>
          <Text style={styles.statusTagText}>ACTIVE</Text>
        </View>
        <Text style={styles.activeRef}>{seatConfirmationCode(reservation._id)}</Text>
      </View>
      <Text style={styles.activeTitle}>
        {roomName} · Seat {reservation.seatNumber}
      </Text>
      <View style={styles.activeMetaRow}>
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          tintColor={Brand.muted}
          size={14}
        />
        <Text style={styles.activeMeta}>{formatIsoDate(reservation.date)}</Text>
      </View>
      <View style={styles.activeMetaRow}>
        <SymbolView
          name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
          tintColor={Brand.muted}
          size={14}
        />
        <Text style={styles.activeMeta}>{formatTime12(reservation.time)}</Text>
      </View>
    </Pressable>
  );
}

function BookActiveCard({ item }: { item: Extract<ActiveItem, { kind: 'book' }> }) {
  const { reservation } = item;
  const title = reservation.bookId?.title ?? 'Reserved book';
  const author = reservation.bookId?.author;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open book reservations"
      onPress={() => router.push('/explore')}
      style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}>
      <View style={styles.activeCardHeader}>
        <View style={[styles.statusTag, styles.statusTagBook]}>
          <Text style={[styles.statusTagText, styles.statusTagBookText]}>PICKUP</Text>
        </View>
        <Text style={styles.activeRef}>{reservation.reservationId}</Text>
      </View>
      <Text style={styles.activeTitle}>{title}</Text>
      {author ? <Text style={styles.activeAuthor}>{author}</Text> : null}
      <View style={styles.activeMetaRow}>
        <SymbolView
          name={{ ios: 'building.columns', android: 'account_balance', web: 'account_balance' }}
          tintColor={Brand.muted}
          size={14}
        />
        <Text style={styles.activeMeta}>{reservation.pickupLocation}</Text>
      </View>
      <View style={styles.activeMetaRow}>
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          tintColor={Brand.muted}
          size={14}
        />
        <Text style={styles.activeMeta}>
          {formatIsoDate(reservation.pickupDate)} · {formatTime12(reservation.pickupTime)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: Brand.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  welcomeEyebrow: {
    color: Brand.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
    marginBottom: 18,
  },
  greeting: {
    color: Brand.ink,
    fontSize: 24,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillOpen: {
    backgroundColor: Brand.paleGreen,
    borderColor: '#c4e7d6',
  },
  statusPillClosed: {
    backgroundColor: '#fdeceb',
    borderColor: '#f3cfcc',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.muted,
  },
  statusDotOpen: {
    backgroundColor: Brand.green,
  },
  statusDotClosed: {
    backgroundColor: Brand.red,
  },
  statusText: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: Brand.green,
  },
  statusTextClosed: {
    color: Brand.red,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Brand.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 10 }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: Brand.ink,
    paddingVertical: 0,
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 16,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Brand.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  quickCopy: {
    color: Brand.muted,
    fontSize: 12.5,
    marginTop: 3,
  },
  stateCard: {
    backgroundColor: Brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyCopy: {
    color: Brand.muted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  emptyButton: {
    backgroundColor: Brand.blue,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: '700',
  },
  activeCard: {
    backgroundColor: Brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 18,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusTag: {
    backgroundColor: Brand.paleGreen,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTagText: {
    color: Brand.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusTagBook: {
    backgroundColor: Brand.paleBlue,
  },
  statusTagBookText: {
    color: Brand.blue,
  },
  activeRef: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeTitle: {
    color: Brand.ink,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  activeAuthor: {
    color: Brand.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  activeMeta: {
    color: Brand.muted,
    fontSize: 13.5,
  },
  errorText: {
    color: Brand.red,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
