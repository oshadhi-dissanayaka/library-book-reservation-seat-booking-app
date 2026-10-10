import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ManagementBottomBar } from '@/components/management-bottom-bar';
import { API_BASE_URL } from '@/constants/api';
import { authHeaders } from '@/lib/auth-session';

/**
 * Management → Staff Accounts (route "/management/staff-accounts").
 *
 * Minimal Library Staff account administration:
 *   - list library staff accounts
 *   - add a library staff account (temporary password, hashed server-side,
 *     mustChangePassword = true, role forced to library_staff)
 *   - deactivate / reactivate a staff account
 *
 * Backend: GET/POST /api/management/library-staff (management role only).
 */

type StaffAccount = {
  institutionalId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
};

type ListResponse = { staff?: StaffAccount[]; message?: string };

export default function ManagementStaffAccountsScreen() {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/management/library-staff`, {
        headers: { Accept: 'application/json', ...authHeaders() },
      });
      const payload = (await response.json().catch(() => null)) as ListResponse | null;
      if (!response.ok) {
        throw new Error(payload?.message || `Request failed (${response.status}).`);
      }
      setStaff(Array.isArray(payload?.staff) ? payload!.staff! : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load library staff accounts.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the initial read does not set state synchronously in the
    // effect body (matches the debounce pattern used by the books screen).
    const timer = setTimeout(() => void loadStaff(), 0);
    return () => clearTimeout(timer);
  }, [loadStaff]);

  const openCreateModal = () => {
    setStaffId('');
    setName('');
    setEmail('');
    setTemporaryPassword('');
    setFormError('');
    setModalVisible(true);
  };

  const handleCreate = async () => {
    const id = staffId.trim().toUpperCase();
    const universityEmail = email.trim().toLowerCase();
    const displayName = name.trim();

    if (!id || !displayName || !universityEmail) {
      setFormError('Staff ID, name and university email are required.');
      return;
    }
    if (temporaryPassword && temporaryPassword.length < 8) {
      setFormError('Temporary password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const response = await fetch(`${API_BASE_URL}/management/library-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          institutionalId: id,
          name: displayName,
          email: universityEmail,
          // Omit the password to let the backend generate a temporary one.
          ...(temporaryPassword ? { password: temporaryPassword } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        staff?: StaffAccount;
        temporaryPassword?: string;
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message || `Request failed (${response.status}).`);
      }

      setModalVisible(false);
      await loadStaff(true);

      if (payload?.temporaryPassword) {
        // Shown exactly once - the plaintext is never stored or re-fetched.
        Alert.alert(
          'Library Staff account created',
          `${payload.staff?.name ?? displayName} (${id}) can sign in with:\n\n` +
            `ID: ${id}\nTemporary password: ${payload.temporaryPassword}\n\n` +
            'Share it securely - it is hashed in the database and flagged for password change.'
        );
      } else {
        Alert.alert('Library Staff account created', `${displayName} (${id}) can now sign in.`);
      }
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create the account.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (account: StaffAccount) => {
    const nextActive = !account.active;
    const action = nextActive ? 'reactivate' : 'deactivate';
    Alert.alert(
      `${nextActive ? 'Reactivate' : 'Deactivate'} staff account`,
      `${account.name} (${account.institutionalId}) will be ${action}d.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Reactivate' : 'Deactivate',
          style: nextActive ? 'default' : 'destructive',
          onPress: () => {
            setTogglingId(account.institutionalId);
            void (async () => {
              try {
                const response = await fetch(
                  `${API_BASE_URL}/management/library-staff/${encodeURIComponent(
                    account.institutionalId
                  )}/status`,
                  {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ active: nextActive }),
                  }
                );
                const payload = (await response.json().catch(() => null)) as {
                  message?: string;
                } | null;
                if (!response.ok) {
                  throw new Error(payload?.message || `Request failed (${response.status}).`);
                }
                await loadStaff(true);
              } catch (requestError) {
                Alert.alert(
                  'Update failed',
                  requestError instanceof Error ? requestError.message : 'Please try again.'
                );
              } finally {
                setTogglingId(null);
              }
            })();
          },
        },
      ]
    );
  };

  const activeCount = staff.filter((account) => account.active).length;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 95 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadStaff(true)}
            tintColor="#1E3A8A"
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="border-b border-slate-100 bg-white px-6 pb-5 pt-12">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
                University Management
              </Text>
              <Text className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Staff Accounts
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {staff.length} library staff · {activeCount} active
              </Text>
            </View>
            <Pressable
              onPress={openCreateModal}
              accessibilityRole="button"
              accessibilityLabel="Add library staff account"
              className="flex-row items-center rounded-2xl bg-blue-950 px-4 py-3 active:opacity-90">
              <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold text-white">Add Staff</Text>
            </Pressable>
          </View>
        </View>

        {/* Info card */}
        <View className="mx-5 mt-4 flex-row items-start rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <Ionicons name="shield-checkmark-outline" size={18} color="#1E3A8A" />
          <Text className="ml-3 flex-1 text-[11px] leading-5 text-slate-600">
            Library Staff accounts are issued here only. Students, academic staff and other
            management accounts cannot be created from this screen. Temporary passwords are
            hashed before storage and must be changed by the staff member.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View className="mx-5 mt-4 flex-row items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
            <Text className="ml-2 flex-1 text-xs font-medium text-red-700">{error}</Text>
          </View>
        ) : null}

        {/* List */}
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#1E3A8A" />
            <Text className="mt-3 text-xs text-slate-500">Loading staff accounts…</Text>
          </View>
        ) : (
          <View className="mx-5 mt-4 gap-3">
            {staff.length === 0 && !error ? (
              <View className="items-center rounded-2xl border border-slate-200 bg-white p-8">
                <Ionicons name="people-outline" size={28} color="#94A3B8" />
                <Text className="mt-2 text-sm font-semibold text-slate-600">
                  No library staff accounts yet
                </Text>
              </View>
            ) : null}

            {staff.map((account) => (
              <View
                key={account.institutionalId}
                className="flex-row items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                  <Text className="text-sm font-bold text-blue-900">
                    {(account.name || account.institutionalId).charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View className="ml-3 flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-sm font-bold text-slate-900">{account.name}</Text>
                    <View
                      className={`ml-2 rounded-full px-2 py-0.5 ${
                        account.active ? 'bg-emerald-50' : 'bg-slate-100'
                      }`}>
                      <Text
                        className={`text-[10px] font-bold ${
                          account.active ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                        {account.active ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-0.5 text-xs font-semibold text-blue-800">
                    {account.institutionalId}
                  </Text>
                  <Text className="text-[11px] text-slate-500">{account.email}</Text>
                  {account.mustChangePassword ? (
                    <Text className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                      Password change required
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => void handleToggleActive(account)}
                  disabled={togglingId === account.institutionalId}
                  accessibilityRole="button"
                  accessibilityLabel={`${
                    account.active ? 'Deactivate' : 'Reactivate'
                  } ${account.name}`}
                  className={`items-center justify-center rounded-xl border px-3 py-2 ${
                    account.active ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'
                  }`}>
                  {togglingId === account.institutionalId ? (
                    <ActivityIndicator size="small" color="#1E3A8A" />
                  ) : (
                    <Text
                      className={`text-[11px] font-bold ${
                        account.active ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                      {account.active ? 'Deactivate' : 'Reactivate'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add library staff modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-3xl bg-white px-6 pb-10 pt-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">Add Library Staff</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={18} color="#475569" />
              </Pressable>
            </View>
            <Text className="mt-1 text-xs text-slate-500">
              Role is fixed to Library Staff. Leave the password empty to generate a temporary
              one.
            </Text>

            <ScrollView
              className="mt-5"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text className="mb-1.5 text-xs font-semibold text-slate-800">Library Staff ID</Text>
              <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <Ionicons name="id-card-outline" size={18} color="#64748B" />
                <TextInput
                  value={staffId}
                  onChangeText={(value) => {
                    setStaffId(value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. LIB002"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  className="ml-3 flex-1 text-sm font-medium text-slate-900"
                />
              </View>

              <Text className="mb-1.5 text-xs font-semibold text-slate-800">Full Name</Text>
              <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. Mihan Perera"
                  placeholderTextColor="#94A3B8"
                  className="ml-3 flex-1 text-sm font-medium text-slate-900"
                />
              </View>

              <Text className="mb-1.5 text-xs font-semibold text-slate-800">University Email</Text>
              <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <Ionicons name="mail-outline" size={18} color="#64748B" />
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. staff@sliit.lk"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="ml-3 flex-1 text-sm font-medium text-slate-900"
                />
              </View>

              <Text className="mb-1.5 text-xs font-semibold text-slate-800">
                Temporary Password (optional)
              </Text>
              <View className="mb-2 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                <TextInput
                  value={temporaryPassword}
                  onChangeText={(value) => {
                    setTemporaryPassword(value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Leave empty to generate"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  secureTextEntry
                  className="ml-3 flex-1 text-sm font-medium text-slate-900"
                />
              </View>
              <Text className="text-[11px] text-slate-500">
                Minimum 8 characters with letters and numbers. Stored only as a hash.
              </Text>

              {formError ? (
                <View className="mt-3 flex-row items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                  <Text className="ml-2 flex-1 text-xs font-medium text-red-700">{formError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => void handleCreate()}
                disabled={submitting}
                accessibilityRole="button"
                className="mt-5 flex-row items-center justify-center rounded-2xl bg-blue-950 py-4 active:opacity-90">
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                    <Text className="ml-2 text-sm font-bold tracking-wide text-white">
                      Create Library Staff
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ManagementBottomBar currentTab="staff" />
    </View>
  );
}
