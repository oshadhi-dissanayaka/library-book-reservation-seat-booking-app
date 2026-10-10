import { Link, router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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

import { Book, Reservation, booksApi, reservationsApi } from '@/lib/api';
import { formatDateTime, formatPickupDateTime, getPickupDateOptions } from '@/lib/dates';

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
};

const pickupDates = getPickupDateOptions();

export default function BookSearchScreen() {
  // Home's search bar lands here with ?q=<query>; the param only seeds the
  // initial text — all searching still happens through the existing flow.
  const linkedQuery = useLocalSearchParams<{ q?: string }>().q;
  const initialQuery: string = (Array.isArray(linkedQuery) ? linkedQuery[0] : linkedQuery) ?? '';
  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [booking, setBooking] = useState(false);
  const [patronId, setPatronId] = useState('');
  const [pickupDate, setPickupDate] = useState(pickupDates[0].value);
  const [pickupHour, setPickupHour] = useState('09');
  const [pickupMinute, setPickupMinute] = useState('00');
  const [pickupPeriod, setPickupPeriod] = useState<'AM' | 'PM'>('AM');
  const [pickupLocation, setPickupLocation] = useState('');

  const getPickupTime24 = () => {
    let hour = parseInt(pickupHour, 10);
    if (pickupPeriod === 'PM' && hour !== 12) hour += 12;
    if (pickupPeriod === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${pickupMinute}`;
  };

  const handlePickupHourChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    if (digits === '') {
      setPickupHour('');
      return;
    }
    const hour = parseInt(digits, 10);
    if (hour >= 1 && hour <= 12) {
      setPickupHour(String(hour).padStart(2, '0'));
    }
  };

  const handlePickupMinuteChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    if (digits === '') {
      setPickupMinute('');
      return;
    }
    const minute = parseInt(digits, 10);
    if (minute >= 0 && minute <= 59) {
      setPickupMinute(String(minute).padStart(2, '0'));
    }
  };
  const [editingPickupLocation, setEditingPickupLocation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  const loadBooks = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const result = await booksApi.search(search, category, availableOnly);
      setConnected(true);
      setBooks(result.items);
      setTotal(result.total);
      setCategories(result.categories);
    } catch (requestError) {
      setConnected(false);
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void loadBooks(), 250);
    return () => clearTimeout(timer);
  }, [search, category, availableOnly]);

  // Re-seed when Home (or any route) pushes a new ?q= while this tab is
  // already mounted. Deferred to a callback (not run synchronously in the
  // effect body) so it doesn't cause a cascading render; the debounce effect
  // above then re-runs the search once `search` updates.
  useEffect(() => {
    const query: string = (Array.isArray(linkedQuery) ? linkedQuery[0] : linkedQuery) ?? '';
    const timer = setTimeout(() => {
      setSearch((current) => (query !== current ? query : current));
    }, 0);
    return () => clearTimeout(timer);
  }, [linkedQuery]);

  const openBook = (book: Book) => {
    setSelectedBook(book);
    setBooking(false);
    setCreatedReservation(null);
    setFormError('');
    setTermsAccepted(false);
    setPickupDate(pickupDates[0].value);
    setPickupHour('09');
    setPickupMinute('00');
    setPickupPeriod('AM');
    setPickupLocation(book.library || '');
    setEditingPickupLocation(!book.library);
  };

  const closeBook = () => {
    if (submitting) return;
    setSelectedBook(null);
    setBooking(false);
    setCreatedReservation(null);
    setFormError('');
  };

  const cancelBooking = () => {
    if (submitting) return;
    setFormError('');
    setBooking(false);
    setCreatedReservation(null);
    setSelectedBook(null);
  };

  const submitReservation = async () => {
    if (!selectedBook) return;
    const normalizedPatronId = patronId.trim().toUpperCase();
    if (normalizedPatronId.length < 3) {
      setFormError('Enter your student or library ID to continue.');
      return;
    }
    if (!termsAccepted) {
      setFormError('Accept the reservation terms to continue.');
      return;
    }
    const normalizedPickupLocation = pickupLocation.trim();
    if (normalizedPickupLocation.length < 3) {
      setFormError('Choose or enter a pickup library or desk.');
      return;
    }
    const pickupTime24 = getPickupTime24();
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(pickupTime24)) {
      setFormError('Choose a valid pickup time.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const reservation = await reservationsApi.create({
        bookId: selectedBook._id,
        patronId: normalizedPatronId,
        pickupDate,
        pickupTime: pickupTime24,
        pickupLocation: normalizedPickupLocation,
        termsAccepted,
      });
      setPatronId(normalizedPatronId);
      setCreatedReservation(reservation);
      setBooking(false);
      await loadBooks(true);
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to reserve this book.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedCategories = ['All', ...categories];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadBooks(true)} tintColor={palette.navy} />}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <SymbolView name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }} tintColor={palette.white} size={18} />
            </View>
            <View>
              <Text style={styles.brandTitle}>UNIVERSITY LIBRARY</Text>
              <Text style={styles.brandSubtitle}>CATALOG & ARCHIVE</Text>
            </View>
          </View>
          <Link href="/my-reservations" asChild>
            <Pressable style={({ pressed }) => [styles.reservationsLink, pressed && styles.pressed]} accessibilityRole="button">
              <SymbolView name={{ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }} tintColor={palette.navy} size={16} />
              <Text style={styles.reservationsLinkText}>My reservations</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LIBRARY ARCHIVES</Text>
          <Text style={styles.heroTitle}>Find your next{'\n'}good read.</Text>
          <Text style={styles.heroCopy}>Search the university catalog and reserve a copy for pickup.</Text>
          <View style={styles.searchBox}>
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={palette.muted} size={19} />
            <TextInput
              accessibilityLabel="Search by title, author, ISBN, or call number"
              autoCapitalize="none"
              onChangeText={setSearch}
              placeholder="Title, author, ISBN, call number"
              placeholderTextColor="#8792a5"
              returnKeyType="search"
              selectionColor={palette.muted}
              underlineColorAndroid="transparent"
              style={styles.searchInput}
              value={search}
            />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Search results</Text>
            <Text style={styles.resultCount}>
              {loading
                ? 'Checking catalog…'
                : error
                  ? 'Catalog connection unavailable'
                  : `${total} ${total === 1 ? 'title' : 'titles'} in catalog`}
            </Text>
          </View>
          <View style={[styles.liveIndicator, !connected && styles.offlineIndicator]}>
            <View style={[styles.liveDot, !connected && styles.offlineDot]} />
            <Text style={[styles.liveText, !connected && styles.offlineText]}>{connected ? 'LIVE CATALOG' : 'OFFLINE'}</Text>
          </View>
        </View>

        {(categories.length > 0 || total > 0) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {displayedCategories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={({ pressed }) => [styles.filterChip, category === item && styles.filterChipSelected, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected: category === item }}>
                <Text style={[styles.filterText, category === item && styles.filterTextSelected]}>{item}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setAvailableOnly((value) => !value)}
              style={({ pressed }) => [styles.filterChip, availableOnly && styles.filterChipSelected, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: availableOnly }}>
              <Text style={[styles.filterText, availableOnly && styles.filterTextSelected]}>Available now</Text>
            </Pressable>
          </ScrollView>
        )}

        {error ? (
          <View style={styles.statePanel}>
            <View style={styles.stateIcon}><SymbolView name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} tintColor={palette.navy} size={22} /></View>
            <Text style={styles.stateTitle}>Catalog unavailable</Text>
            <Text style={styles.stateCopy}>{error}</Text>
            <Pressable onPress={() => void loadBooks()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={palette.navy} size="large" />
            <Text style={styles.loadingText}>Searching the library catalog</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.statePanel}>
            <View style={styles.stateIcon}><SymbolView name={{ ios: 'books.vertical', android: 'menu_book', web: 'menu_book' }} tintColor={palette.navy} size={22} /></View>
            <Text style={styles.stateTitle}>{search ? 'No matching books' : 'Catalog is empty'}</Text>
            <Text style={styles.stateCopy}>{search ? 'Try another title, author, or ISBN.' : 'No books have been added to the MongoDB catalog yet.'}</Text>
            {search.length > 0 && <Pressable onPress={() => setSearch('')}><Text style={styles.clearText}>Clear search</Text></Pressable>}
          </View>
        ) : (
          <View style={styles.bookList}>
            {books.map((book) => (
              <Pressable key={book._id} onPress={() => openBook(book)} style={({ pressed }) => [styles.bookRow, pressed && styles.bookRowPressed]} accessibilityRole="button">
                <View style={[styles.bookCover, book.availableCopies === 0 && styles.bookCoverUnavailable]}>
                  {book.coverImage ? (
                    <Image source={{ uri: book.coverImage }} resizeMode="cover" style={styles.bookCoverImage} />
                  ) : (
                    <>
                      <SymbolView name={{ ios: 'books.vertical.fill', android: 'menu_book', web: 'menu_book' }} tintColor={palette.white} size={25} />
                      <Text style={styles.coverInitial}>{book.title.slice(0, 1).toUpperCase()}</Text>
                    </>
                  )}
                </View>
                <View style={styles.bookInfo}>
                  <View style={styles.bookMetaRow}>
                    <Text style={styles.bookCategory} numberOfLines={1}>{book.category}</Text>
                    <Text style={[styles.availability, book.availableCopies > 0 ? styles.available : styles.unavailable]}>
                      {book.availableCopies > 0 ? `${book.availableCopies} available` : 'On loan'}
                    </Text>
                  </View>
                  <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                  <View style={styles.bookLocationRow}>
                    <SymbolView name={{ ios: 'building.2', android: 'apartment', web: 'apartment' }} tintColor={palette.muted} size={12} />
                    <Text style={styles.bookLocation} numberOfLines={1}>{book.library}{book.shelf ? ` · ${book.shelf}` : ''}</Text>
                    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="#8b96a8" size={13} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.footerNote}>
          <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} tintColor={palette.muted} size={14} />
          <Text style={styles.footerText}>Reservations expire 48 hours after the selected pickup date.</Text>
        </View>
      </ScrollView>

      <Modal visible={selectedBook !== null} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeBook}>
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalTopBar}>
              <Pressable onPress={booking ? () => { setBooking(false); setFormError(''); } : closeBook} accessibilityRole="button" accessibilityLabel={booking ? 'Back to book details' : 'Close book details'} style={styles.modalIconButton}>
                <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={palette.ink} size={18} />
              </Pressable>
              <Text style={styles.modalTopTitle}>{createdReservation ? 'Reservation pass' : booking ? 'Reserve book' : 'Book details'}</Text>
              <Pressable onPress={closeBook} accessibilityRole="button" accessibilityLabel="Close" style={styles.modalIconButton}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={palette.ink} size={18} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              {selectedBook && !createdReservation && (
                <View style={styles.detailBookHeader}>
                  <View style={styles.detailCover}>
                    {selectedBook.coverImage ? (
                      <Image source={{ uri: selectedBook.coverImage }} resizeMode="cover" style={styles.detailCoverImage} />
                    ) : (
                      <SymbolView name={{ ios: 'books.vertical.fill', android: 'menu_book', web: 'menu_book' }} tintColor={palette.white} size={36} />
                    )}
                  </View>
                  <View style={styles.detailHeading}>
                    <Text style={styles.detailCategory}>{selectedBook.category.toUpperCase()}</Text>
                    <Text style={styles.detailTitle}>{selectedBook.title}</Text>
                    <Text style={styles.detailAuthor}>{selectedBook.author}</Text>
                    {selectedBook.publicationYear ? <Text style={styles.detailYear}>{selectedBook.publicationYear}</Text> : null}
                  </View>
                </View>
              )}

              {createdReservation ? (
                <View style={styles.successPanel}>
                  <View style={styles.successIcon}><SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor={palette.white} size={28} /></View>
                  <View style={styles.processedBadge}><View style={styles.liveDot} /><Text style={styles.processedText}>REQUEST PROCESSED</Text></View>
                  <Text style={styles.successTitle}>Reservation confirmed</Text>
                  <Text style={styles.successCopy}>Your copy has been reserved for collection at {createdReservation.pickupLocation}.</Text>

                  <View style={styles.passCard}>
                    <View style={styles.passBookRow}>
                      <View style={styles.passBookMark}><SymbolView name={{ ios: 'books.vertical.fill', android: 'menu_book', web: 'menu_book' }} tintColor={palette.white} size={20} /></View>
                      <View style={styles.passBookText}>
                        <Text style={styles.passLabel}>CATALOG ENTRY</Text>
                        <Text style={styles.passBookTitle}>{createdReservation.bookId?.title || selectedBook?.title}</Text>
                        <Text style={styles.passBookAuthor}>{createdReservation.bookId?.author || selectedBook?.author}</Text>
                      </View>
                    </View>
                    <View style={styles.passDivider} />
                    <View style={styles.passField}>
                      <Text style={styles.passLabel}>TRACKING IDENTIFIER</Text>
                      <Text selectable style={styles.passTracking}>{createdReservation.reservationId}</Text>
                    </View>
                    <View style={styles.passDetails}>
                      <View style={styles.passDetailRow}>
                        <SymbolView name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }} tintColor={palette.green} size={14} />
                        <Text style={styles.passDetailLabel}>Status</Text>
                        <Text style={styles.passStatus}>{createdReservation.status}</Text>
                      </View>
                      <View style={styles.passDetailRow}>
                        <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={palette.navy} size={14} />
                        <Text style={styles.passDetailLabel}>Pickup</Text>
                        <Text style={styles.passDetailValue}>{createdReservation.pickupLocation}</Text>
                      </View>
                      <View style={styles.passDetailRow}>
                        <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} tintColor={palette.navy} size={14} />
                        <Text style={styles.passDetailLabel}>Date</Text>
                        <Text style={styles.passDetailValue}>{formatPickupDateTime(createdReservation.pickupDate, createdReservation.pickupTime)}</Text>
                      </View>
                      <View style={styles.passDetailRow}>
                        <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} tintColor={palette.navy} size={14} />
                        <Text style={styles.passDetailLabel}>Expires</Text>
                        <Text style={styles.passDetailValue}>{formatDateTime(createdReservation.holdExpiresAt)}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.passNotice}>Bring your student card to {createdReservation.pickupLocation} before the reservation expires.</Text>
                  <Pressable
                    onPress={() => {
                      closeBook();
                      router.push({ pathname: '/my-reservations', params: { patronId } });
                    }}
                    style={({ pressed }) => [styles.primaryButton, styles.fullButton, pressed && styles.pressed]}
                    accessibilityRole="button">
                    <Text style={styles.primaryButtonText}>View my reservation</Text>
                    <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor={palette.white} size={16} />
                  </Pressable>
                  <Pressable onPress={closeBook} style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]} accessibilityRole="button">
                    <Text style={styles.returnButtonText}>Return to search results</Text>
                  </Pressable>
                  <Text style={styles.passHelp}>Need a different pickup date? You can change it from My Reservations.</Text>
                </View>
              ) : booking && selectedBook ? (
                <View style={styles.formSection}>
                  <View style={styles.formBookSummary}>
                    <Text style={styles.formBookTitle} numberOfLines={2}>{selectedBook.title}</Text>
                    <Text style={styles.formBookMeta}>{selectedBook.author}{selectedBook.library ? ` · ${selectedBook.library}` : ''}</Text>
                  </View>
                  <Text style={styles.fieldLabel}>STUDENT / LIBRARY ID</Text>
                  <TextInput
                    accessibilityLabel="Student or library ID"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onChangeText={setPatronId}
                    placeholder="Enter your university ID"
                    placeholderTextColor="#8792a5"
                    style={styles.formInput}
                    value={patronId}
                  />
                  <View style={styles.labelWithHint}>
                    <Text style={styles.fieldLabel}>PICKUP DATE</Text>
                    <Text style={styles.fieldHint}>Select within 6 days</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateOptions}>
                    {pickupDates.map((option) => (
                      <Pressable key={option.value} onPress={() => setPickupDate(option.value)} style={({ pressed }) => [styles.dateOption, pickupDate === option.value && styles.dateOptionSelected, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ selected: pickupDate === option.value }}>
                        <Text style={[styles.dateOptionDay, pickupDate === option.value && styles.dateOptionTextSelected]}>{option.label}</Text>
                        <Text style={[styles.dateOptionDate, pickupDate === option.value && styles.dateOptionTextSelected]}>{option.day}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={styles.labelWithHint}>
                    <Text style={styles.fieldLabel}>PICKUP TIME</Text>
                    <Text style={styles.fieldHint}>Select hour, minute, and AM/PM</Text>
                  </View>
                  <View style={styles.timePickerRow}>
                    <View style={styles.timeInputGroup}>
                      <TextInput
                        accessibilityLabel="Pickup hour"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="numeric"
                        maxLength={2}
                        onChangeText={handlePickupHourChange}
                        placeholder="HH"
                        placeholderTextColor="#8792a5"
                        style={styles.timeInput}
                        value={pickupHour}
                      />
                      <Text style={styles.timeSeparator}>:</Text>
                      <TextInput
                        accessibilityLabel="Pickup minute"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="numeric"
                        maxLength={2}
                        onChangeText={handlePickupMinuteChange}
                        placeholder="MM"
                        placeholderTextColor="#8792a5"
                        style={styles.timeInput}
                        value={pickupMinute}
                      />
                    </View>
                    <View style={styles.periodPicker}>
                      <Pressable
                        onPress={() => setPickupPeriod('AM')}
                        style={({ pressed }) => [styles.periodButton, pickupPeriod === 'AM' && styles.periodButtonSelected, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: pickupPeriod === 'AM' }}>
                        <Text style={[styles.periodButtonText, pickupPeriod === 'AM' && styles.periodButtonTextSelected]}>AM</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setPickupPeriod('PM')}
                        style={({ pressed }) => [styles.periodButton, pickupPeriod === 'PM' && styles.periodButtonSelected, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: pickupPeriod === 'PM' }}>
                        <Text style={[styles.periodButtonText, pickupPeriod === 'PM' && styles.periodButtonTextSelected]}>PM</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.pickupInfo}>
                    <View style={styles.pickupInfoIcon}><SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={palette.navy} size={17} /></View>
                    <View style={styles.pickupInfoText}>
                      <Text style={styles.pickupInfoLabel}>PICKUP LOCATION</Text>
                      <Text style={styles.pickupInfoValue}>{pickupLocation || 'Pickup desk required'}</Text>
                    </View>
                    <Text style={styles.pickupCopies}>{selectedBook.availableCopies} cop{selectedBook.availableCopies === 1 ? 'y' : 'ies'}</Text>
                    {!editingPickupLocation && pickupLocation ? (
                      <Pressable onPress={() => setEditingPickupLocation(true)} accessibilityRole="button">
                        <Text style={styles.changeDeskText}>Change</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {editingPickupLocation || !pickupLocation ? (
                    <TextInput
                      accessibilityLabel="Pickup library or desk"
                      autoCapitalize="words"
                      onChangeText={setPickupLocation}
                      placeholder="Enter library or circulation desk"
                      placeholderTextColor="#8792a5"
                      style={styles.formInput}
                      value={pickupLocation}
                    />
                  ) : null}

                  <Pressable onPress={() => setTermsAccepted((value) => !value)} style={styles.termsRow} accessibilityRole="checkbox" accessibilityState={{ checked: termsAccepted }}>
                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                      {termsAccepted && <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor={palette.white} size={13} />}
                    </View>
                    <Text style={styles.termsText}>I agree to the library reservation terms and will collect the book on the selected date.</Text>
                  </Pressable>

                  {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                  <Pressable onPress={() => void submitReservation()} disabled={submitting || selectedBook.availableCopies === 0} style={({ pressed }) => [styles.primaryButton, styles.fullButton, (submitting || selectedBook.availableCopies === 0) && styles.disabledButton, pressed && styles.pressed]}>
                    {submitting ? <ActivityIndicator color={palette.white} size="small" /> : <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor={palette.white} size={15} />}
                    <Text style={styles.primaryButtonText}>{submitting ? 'Reserving…' : 'Confirm reservation'}</Text>
                  </Pressable>
                  <Pressable onPress={cancelBooking} disabled={submitting} style={({ pressed }) => [styles.cancelReservationButton, pressed && styles.pressed]} accessibilityRole="button">
                    <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={palette.navy} size={14} />
                    <Text style={styles.cancelReservationText}>Cancel and return to search</Text>
                  </Pressable>
                  <Text style={styles.privacyNote}>Your ID is used only to look up and manage this reservation.</Text>
                </View>
              ) : selectedBook ? (
                <View style={styles.detailContent}>
                  <View style={styles.availabilityPanel}>
                    <View style={[styles.liveDot, selectedBook.availableCopies === 0 && styles.soldOutDot]} />
                    <Text style={[styles.availabilityPanelText, selectedBook.availableCopies === 0 && styles.unavailable]}>{selectedBook.availableCopies > 0 ? `${selectedBook.availableCopies} copies available` : 'Currently on loan'}</Text>
                    {selectedBook.callNumber ? <Text style={styles.callNumber}>{selectedBook.callNumber}</Text> : null}
                  </View>

                  <Text style={styles.detailSectionHeading}>LOCATION</Text>
                  <View style={styles.detailInfoRow}>
                    <SymbolView name={{ ios: 'building.2', android: 'apartment', web: 'apartment' }} tintColor={palette.navy} size={18} />
                    <View style={styles.detailInfoCopy}>
                      <Text style={styles.detailInfoPrimary}>{selectedBook.library}</Text>
                      <Text style={styles.detailInfoSecondary}>{selectedBook.shelf ? `Shelf ${selectedBook.shelf}` : 'Ask at the library desk'}</Text>
                    </View>
                  </View>

                  {selectedBook.isbn ? <Text style={styles.detailMeta}>ISBN  {selectedBook.isbn}</Text> : null}
                  {selectedBook.publisher ? <Text style={styles.detailMeta}>{selectedBook.publisher}</Text> : null}
                  {selectedBook.description ? <Text style={styles.description}>{selectedBook.description}</Text> : null}

                  <Pressable onPress={() => setBooking(true)} disabled={selectedBook.availableCopies === 0} style={({ pressed }) => [styles.primaryButton, styles.fullButton, selectedBook.availableCopies === 0 && styles.disabledButton, pressed && styles.pressed]}>
                    <SymbolView name={{ ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }} tintColor={palette.white} size={16} />
                    <Text style={styles.primaryButtonText}>{selectedBook.availableCopies > 0 ? 'Reserve this book' : 'No copies available'}</Text>
                  </Pressable>
                  {selectedBook.availableCopies === 0 && <Text style={styles.privacyNote}>Search again later to check availability.</Text>}
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 36 },
  topBar: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: palette.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  brandSubtitle: { color: palette.muted, fontSize: 9, fontWeight: '700', marginTop: 3 },
  reservationsLink: { minHeight: 38, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 7 },
  reservationsLinkText: { color: palette.navy, fontSize: 12, fontWeight: '700' },
  hero: { marginTop: 16, padding: 20, borderRadius: 18, backgroundColor: palette.navy },
  eyebrow: { color: '#c3d4fb', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: palette.white, fontSize: 30, lineHeight: 34, fontWeight: '800', marginTop: 10 },
  heroCopy: { color: '#d8e2f8', fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 330 },
  searchBox: { height: 48, borderRadius: 11, paddingHorizontal: 13, marginTop: 20, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, color: palette.ink, fontSize: 13 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  resultCount: { color: palette.muted, fontSize: 11, marginTop: 3 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20, backgroundColor: palette.paleGreen },
  offlineIndicator: { backgroundColor: '#fff0ef' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.green },
  offlineDot: { backgroundColor: palette.red },
  liveText: { color: palette.green, fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  offlineText: { color: palette.red },
  filters: { gap: 7, paddingTop: 16, paddingBottom: 13 },
  filterChip: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white },
  filterChipSelected: { borderColor: palette.navy, backgroundColor: palette.navy },
  filterText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  filterTextSelected: { color: palette.white },
  bookList: { gap: 9, marginTop: 3 },
  bookRow: { minHeight: 116, padding: 12, gap: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white },
  bookRowPressed: { opacity: 0.82 },
  bookCover: { width: 66, height: 90, borderRadius: 8, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center', gap: 5 },
  bookCoverImage: { width: '100%', height: '100%', borderRadius: 8 },
  bookCoverUnavailable: { backgroundColor: '#8993a5' },
  coverInitial: { color: palette.white, fontSize: 10, fontWeight: '800' },
  bookInfo: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' },
  bookMetaRow: { minHeight: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  bookCategory: { flex: 1, color: palette.blue, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  availability: { fontSize: 9, fontWeight: '700' },
  available: { color: palette.green },
  unavailable: { color: palette.red },
  bookTitle: { color: palette.ink, fontSize: 14, fontWeight: '800', lineHeight: 19, marginTop: 3 },
  bookAuthor: { color: palette.muted, fontSize: 11, marginTop: 3 },
  bookLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  bookLocation: { flex: 1, color: palette.muted, fontSize: 10 },
  statePanel: { minHeight: 225, marginTop: 10, paddingHorizontal: 22, paddingVertical: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.white },
  stateIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: palette.paleBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stateTitle: { color: palette.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateCopy: { maxWidth: 300, color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  clearText: { color: palette.blue, fontSize: 12, fontWeight: '700', padding: 12 },
  loadingPanel: { minHeight: 185, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: palette.muted, fontSize: 12 },
  primaryButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 10, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: palette.white, fontSize: 12, fontWeight: '800' },
  fullButton: { width: '100%', marginTop: 14 },
  disabledButton: { backgroundColor: '#9aa5b7' },
  cancelReservationButton: { minHeight: 40, width: '100%', marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9, backgroundColor: palette.paleBlue },
  cancelReservationText: { color: palette.navy, fontSize: 12, fontWeight: '800' },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2, marginTop: 17 },
  footerText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.78 },
  modalSafeArea: { flex: 1, backgroundColor: palette.canvas },
  modalFlex: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 700 },
  modalTopBar: { height: 56, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.white },
  modalIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalTopTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  modalContent: { padding: 20, paddingBottom: 40 },
  detailContent: { paddingBottom: 16 },
  detailBookHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 21 },
  detailCover: { width: 95, height: 126, borderRadius: 11, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  detailCoverImage: { width: '100%', height: '100%', borderRadius: 11 },
  detailHeading: { flex: 1, minWidth: 0 },
  detailCategory: { color: palette.blue, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  detailTitle: { color: palette.ink, fontSize: 21, lineHeight: 26, fontWeight: '800', marginTop: 7 },
  detailAuthor: { color: palette.muted, fontSize: 13, marginTop: 6 },
  detailYear: { color: palette.muted, fontSize: 11, marginTop: 4 },
  availabilityPanel: { minHeight: 48, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, backgroundColor: palette.paleGreen },
  availabilityPanelText: { flex: 1, color: palette.green, fontSize: 12, fontWeight: '800' },
  soldOutDot: { backgroundColor: palette.red },
  callNumber: { color: palette.muted, fontSize: 10 },
  detailSectionHeading: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 22, marginBottom: 10 },
  detailInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line },
  detailInfoCopy: { flex: 1 },
  detailInfoPrimary: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  detailInfoSecondary: { color: palette.muted, fontSize: 10, marginTop: 4 },
  detailMeta: { color: palette.muted, fontSize: 11, marginTop: 12 },
  description: { color: palette.muted, fontSize: 12, lineHeight: 19, marginTop: 16 },
  formSection: { gap: 11 },
  formBookSummary: { marginBottom: 5, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: palette.line },
  formBookTitle: { color: palette.ink, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  formBookMeta: { color: palette.muted, fontSize: 11, marginTop: 5 },
  fieldLabel: { color: palette.ink, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  fieldHint: { color: palette.muted, fontSize: 10 },
  labelWithHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  formInput: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 9, color: palette.ink, backgroundColor: palette.white, fontSize: 13 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  timeInputGroup: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timeInput: { width: 56, height: 46, paddingHorizontal: 0, borderWidth: 1, borderColor: palette.line, borderRadius: 9, color: palette.ink, backgroundColor: palette.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  timeInputLabel: { color: palette.muted, fontSize: 8, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  timeSeparator: { color: palette.navy, fontSize: 20, fontWeight: '700', marginHorizontal: 4 },
  periodPicker: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  periodButton: { minWidth: 56, height: 40, borderRadius: 9, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  periodButtonSelected: { borderColor: palette.navy, backgroundColor: palette.navy },
  periodButtonText: { color: palette.muted, fontSize: 11, fontWeight: '800' },
  periodButtonTextSelected: { color: palette.white },
  dateOptions: { gap: 8, paddingVertical: 2 },
  dateOption: { minWidth: 69, minHeight: 56, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 9, backgroundColor: palette.white },
  dateOptionSelected: { borderColor: palette.navy, backgroundColor: palette.navy },
  dateOptionDay: { color: palette.muted, fontSize: 9, fontWeight: '700' },
  dateOptionDate: { color: palette.ink, fontSize: 12, fontWeight: '800', marginTop: 4 },
  dateOptionTextSelected: { color: palette.white },
  pickupInfo: { minHeight: 57, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 9, backgroundColor: palette.paleBlue },
  pickupInfoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  pickupInfoText: { flex: 1, minWidth: 0 },
  pickupInfoLabel: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  pickupInfoValue: { color: palette.ink, fontSize: 10, fontWeight: '700', marginTop: 3 },
  changeDeskText: { color: palette.blue, fontSize: 9, fontWeight: '800' },
  pickupCopies: { color: palette.navy, fontSize: 9, fontWeight: '800' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 3, paddingVertical: 5 },
  checkbox: { width: 19, height: 19, borderRadius: 5, borderWidth: 1.5, borderColor: '#aab4c3', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: palette.navy, backgroundColor: palette.navy },
  termsText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 15 },
  formError: { color: palette.red, fontSize: 10, lineHeight: 15, marginTop: 2 },
  privacyNote: { color: palette.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 5 },
  successPanel: { flex: 1, alignItems: 'center', paddingVertical: 24 },
  successIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center' },
  processedBadge: { minHeight: 23, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, backgroundColor: palette.paleBlue, marginTop: 10 },
  processedText: { color: palette.navy, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  successTitle: { color: palette.ink, fontSize: 21, fontWeight: '800', textAlign: 'center', marginTop: 18 },
  successCopy: { maxWidth: 360, color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 3 },
  passCard: { width: '100%', maxWidth: 440, padding: 14, marginTop: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.white },
  passBookRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passBookMark: { width: 42, height: 42, borderRadius: 8, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  passBookText: { flex: 1, minWidth: 0 },
  passLabel: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  passBookTitle: { color: palette.ink, fontSize: 12, fontWeight: '800', lineHeight: 16, marginTop: 3 },
  passBookAuthor: { color: palette.muted, fontSize: 9, marginTop: 2 },
  passDivider: { height: 1, backgroundColor: palette.line, marginVertical: 11 },
  passField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  passTracking: { color: palette.navy, fontSize: 11, fontWeight: '800' },
  passDetails: { gap: 7, marginTop: 13 },
  passDetailRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  passDetailLabel: { flex: 1, color: palette.muted, fontSize: 10 },
  passStatus: { color: palette.green, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  passDetailValue: { maxWidth: '60%', color: palette.ink, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  passNotice: { width: '100%', maxWidth: 440, padding: 10, marginTop: 9, borderRadius: 8, color: palette.navy, backgroundColor: palette.paleBlue, fontSize: 9, lineHeight: 14 },
  returnButton: { width: '100%', maxWidth: 440, minHeight: 42, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#e5eafb' },
  returnButtonText: { color: palette.navy, fontSize: 12, fontWeight: '800' },
  passHelp: { color: palette.muted, fontSize: 9, textAlign: 'center', marginTop: 11 },
});
