import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { StaffHeader } from '../components/StaffHeader';
import { StatusBadge } from '../components/StatusBadge';
import { staffApi } from '../services/staffApi';
import { Book, BookStatus } from '../types/staff.types';

interface BookAvailabilityManagementScreenProps {
  staffId?: string;
}

export const BookAvailabilityManagementScreen: React.FC<
  BookAvailabilityManagementScreenProps
> = ({ staffId = 'STF-4092' }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Selected book for editing
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editStatus, setEditStatus] = useState<BookStatus>('Available');
  const [editCopies, setEditCopies] = useState<number>(1);
  const [editShelf, setEditShelf] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await staffApi.getBooks(search);
      if (res.success) {
        setBooks(res.data);
      }
    } catch {
      // Handled by service
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const openEditor = (book: Book) => {
    setSelectedBook(book);
    setEditStatus(book.status);
    setEditCopies(book.availableCopies);
    setEditShelf(book.shelfLocation);
    setEditNotes(book.notes || '');
  };

  const handleSaveAvailability = async () => {
    if (!selectedBook) return;
    setUpdating(true);

    try {
      const res = await staffApi.updateBookAvailability(selectedBook._id, {
        status: editStatus,
        availableCopies: editCopies,
        shelfLocation: editShelf,
        notes: editNotes,
      });

      if (res.success) {
        setBooks((prev) =>
          prev.map((b) => (b._id === selectedBook._id ? res.data : b))
        );
        setSelectedBook(null);
        setFeedback(`Availability updated for "${res.data.title}"`);
        setTimeout(() => setFeedback(''), 3500);
      }
    } catch {
      // Handled
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StaffHeader
        title="Book Availability"
        subtitle="Shelf Stock & Circulation Status"
        staffId={staffId}
        desk="Circulation Desk 01"
      />

      {feedback ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>✓ {feedback}</Text>
        </View>
      ) : null}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search catalog titles, author, shelf..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          CATALOG TITLES ({books.length})
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading book catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.bookCard}>
              <View style={styles.bookHeaderRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {item.author} • {item.edition || '1st Edition'}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.shelfRow}>
                <Text style={styles.shelfLabel}>Location:</Text>
                <Text style={styles.shelfValue}>📍 {item.shelfLocation}</Text>
              </View>

              <View style={styles.stockRow}>
                <View style={styles.stockIndicator}>
                  <Text style={styles.stockText}>
                    {item.availableCopies} of {item.totalCopies} copies available
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changeBtn}
                  onPress={() => openEditor(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>

              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Note:</Text>
                  <Text style={styles.notesText} numberOfLines={2}>
                    {item.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      {/* Book Availability Editor Modal */}
      <Modal
        visible={!!selectedBook}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBook(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.editorSheet}>
            <Text style={styles.sheetTitle}>Update Book Availability</Text>
            <Text style={styles.sheetSub}>{selectedBook?.title}</Text>

            {/* Status Selector */}
            <Text style={styles.fieldLabel}>AVAILABILITY STATUS</Text>
            <View style={styles.statusButtonsRow}>
              {(['Available', 'Unavailable', 'Under Maintenance'] as BookStatus[]).map(
                (st) => {
                  const isSel = editStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusOptionBtn,
                        isSel && styles.activeStatusOptionBtn,
                      ]}
                      onPress={() => setEditStatus(st)}>
                      <Text
                        style={[
                          styles.statusOptionText,
                          isSel && styles.activeStatusOptionText,
                        ]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            {/* Available Copies Stepper */}
            <Text style={styles.fieldLabel}>AVAILABLE COPIES (Max {selectedBook?.totalCopies})</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setEditCopies(Math.max(0, editCopies - 1))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{editCopies}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setEditCopies(
                    Math.min(selectedBook?.totalCopies || 10, editCopies + 1)
                  )
                }>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Shelf Location Input */}
            <Text style={styles.fieldLabel}>SHELF LOCATION</Text>
            <TextInput
              style={styles.inputField}
              value={editShelf}
              onChangeText={setEditShelf}
              placeholder="e.g. Main Library • Shelf A12"
            />

            {/* Notes Input */}
            <Text style={styles.fieldLabel}>STAFF / CONDITION NOTE</Text>
            <TextInput
              style={[styles.inputField, { minHeight: 60 }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="e.g. Sent for spine restoration"
              multiline
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveAvailability}
              disabled={updating}
              activeOpacity={0.8}>
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>UPDATE AVAILABILITY</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSelectedBook(null)}
              disabled={updating}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  counterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  bookCard: {
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
  bookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  bookTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  bookAuthor: {
    color: '#64748B',
    fontSize: 12,
  },
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shelfLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginRight: 6,
  },
  shelfValue: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  stockIndicator: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  changeBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  notesLabel: {
    color: '#991B1B',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  notesText: {
    color: '#B91C1C',
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  editorSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 12,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeStatusOptionBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  activeStatusOptionText: {
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 32,
    textAlign: 'center',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 6,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
