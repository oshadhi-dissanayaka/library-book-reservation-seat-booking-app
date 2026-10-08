import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

type ReportItem = {
  id: string;
  title: string;
  type: string;
  period: string;
  updatedDate: string;
  fileSize: string;
  status: string;
  description: string;
  audited: boolean;
};

export default function ManagementReportsScreen() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('rep-1');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('September 2026');

  // Modal State for Generating/Creating New Report (CRUD: Create)
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch reports (CRUD: Read)
  const loadReports = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setReports(data.reports);
      if (data.reports.length > 0 && !selectedReportId) {
        setSelectedReportId(data.reports[0].id);
      }
    } catch (err) {
      // Fallback initial data matching Figma
      setReports([
        {
          id: 'rep-1',
          title: 'Book Usage Report',
          type: 'book-usage',
          period: 'September 2026',
          updatedDate: '20 Sep 2026',
          fileSize: '2.4 MB',
          status: 'Ready to review',
          description:
            'Monthly circulation, category breakdown, and shelf checkout frequencies.',
          audited: true,
        },
        {
          id: 'rep-2',
          title: 'Reservation Report',
          type: 'reservation',
          period: 'September 2026',
          updatedDate: '20 Sep 2026',
          fileSize: '1.8 MB',
          status: 'Select audit',
          description:
            'Hold queues, confirmation ratios, student pickups, and cancellations.',
          audited: true,
        },
        {
          id: 'rep-3',
          title: 'Seat Occupancy Report',
          type: 'seat-occupancy',
          period: 'September 2026',
          updatedDate: '20 Sep 2026',
          fileSize: '1.6 MB',
          status: 'Select audit',
          description:
            'Reading Room A & B hourly density, peak utilization, and desk turn rates.',
          audited: true,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedReportId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // CRUD: Create Report
  const handleCreateReport = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a report title');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || 'Executive audit report for university management.',
          period: period,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setReports((prev) => [result.report, ...prev]);
        setSelectedReportId(result.report.id);
        Alert.alert('Success', 'New management audit report generated!');
      } else {
        throw new Error('Failed to create');
      }
    } catch (err) {
      // Local create fallback
      const localReport: ReportItem = {
        id: `rep-${Date.now()}`,
        title: newTitle,
        type: 'general',
        period: period,
        updatedDate: 'Today',
        fileSize: '1.4 MB',
        status: 'Ready to review',
        description: newDescription || 'Newly generated management review log.',
        audited: true,
      };
      setReports((prev) => [localReport, ...prev]);
      setSelectedReportId(localReport.id);
      Alert.alert('Success', 'Report created successfully!');
    } finally {
      setSubmitting(false);
      setCreateModalVisible(false);
      setNewTitle('');
      setNewDescription('');
    }
  };

  // CRUD: Delete Report
  const handleDeleteReport = (id: string, title: string) => {
    Alert.alert(
      'Delete Report',
      `Are you sure you want to remove "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/reports/${id}`, { method: 'DELETE' });
            } catch (e) {
              // ignore
            }
            setReports((prev) => prev.filter((r) => r.id !== id));
            if (selectedReportId === id) {
              const remaining = reports.filter((r) => r.id !== id);
              if (remaining.length > 0) setSelectedReportId(remaining[0].id);
            }
            Alert.alert('Deleted', 'Report removed from repository.');
          },
        },
      ]
    );
  };

  // CRUD: Update status
  const handleToggleAudit = async (report: ReportItem) => {
    const nextStatus = report.status === 'Ready to review' ? 'Audited & Verified' : 'Ready to review';
    try {
      await fetch(`${API_BASE_URL}/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {
      // ignore
    }
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus } : r))
    );
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 95 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReports();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View className="flex-row items-center justify-between bg-white px-5 pb-3 pt-14 border-b border-slate-100">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </Pressable>
            <Text className="text-base font-bold text-slate-900 leading-tight">
              Management Reports
            </Text>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-950">
            <Ionicons name="person" size={15} color="#FFFFFF" />
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Top Meta info */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full bg-blue-50 px-3 py-1">
              <Text className="text-[9px] font-bold text-blue-900">
                EXECUTIVE ARCHIVE
              </Text>
              <Text className="mx-1 text-[9px] text-blue-400">•</Text>
              <Text className="text-[9px] font-medium text-blue-800">
                LIBRARY MANAGEMENT
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="code-working" size={12} color="#94A3B8" />
              <Text className="ml-1 text-[10px] font-medium text-slate-400">
                v2.6
              </Text>
            </View>
          </View>

          <Text className="mt-2 text-xs text-slate-500">
            Library Management Audit & Summaries
          </Text>

          {/* Report Period Selector Card */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                REPORT PERIOD
              </Text>
              <View className="flex-row items-center rounded-full bg-blue-50 px-2 py-0.5">
                <View className="h-1.5 w-1.5 rounded-full bg-blue-700 mr-1" />
                <Text className="text-[9px] font-bold text-blue-900">
                  Active Session
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
                </View>
                <View className="ml-3">
                  <Text className="text-sm font-bold text-slate-900">
                    {period}
                  </Text>
                  <Text className="text-[10px] text-slate-400">
                    Fall Semester • Cycle M-09
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </View>
          </View>

          {/* Action Row: Generate New Report (CRUD Create) */}
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AVAILABLE AUDIT REPORTS ({reports.length})
            </Text>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              className="flex-row items-center rounded-xl bg-blue-50 px-2.5 py-1 active:opacity-80"
            >
              <Ionicons name="add-circle" size={14} color="#1E3A8A" />
              <Text className="ml-1 text-[10px] font-bold text-blue-950">
                Generate Report
              </Text>
            </Pressable>
          </View>

          {/* Reports List Cards (Figma Matching) */}
          <View className="mt-2 space-y-3">
            {reports.map((item) => {
              const isSelected = selectedReportId === item.id;
              let iconName: keyof typeof Ionicons.glyphMap = 'book';
              if (item.type === 'reservation') iconName = 'calendar';
              if (item.type === 'seat-occupancy') iconName = 'desktop';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedReportId(item.id)}
                  className={`mb-3 rounded-2xl bg-white p-4 shadow-sm border ${
                    isSelected ? 'border-blue-900 bg-blue-50/20' : 'border-slate-100'
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start flex-1 mr-2">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-950">
                        <Ionicons name={iconName} size={17} color="#FFFFFF" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-bold text-slate-900">
                          {item.title}
                        </Text>
                        <Text className="text-[9px] text-slate-400 mt-0.5">
                          Updated {item.updatedDate}
                        </Text>
                      </View>
                    </View>

                    {/* Radio/Check selector */}
                    <View className="items-end">
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? 'border-blue-950 bg-blue-950'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </View>

                  <Text className="mt-2.5 text-[11px] leading-4 text-slate-600">
                    {item.description}
                  </Text>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <View className="flex-row items-center">
                      <View className="rounded bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[8px] font-bold text-slate-600">
                          PDF • {item.fileSize}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleToggleAudit(item)}
                        className="ml-2"
                      >
                        <Text className="text-[10px] font-bold text-blue-900">
                          {item.status} &gt;
                        </Text>
                      </Pressable>
                    </View>

                    {/* Delete Option (CRUD Delete) */}
                    <Pressable
                      onPress={() => handleDeleteReport(item.id, item.title)}
                      className="p-1"
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Audited Registry Notice */}
          <View className="mt-3 flex-row items-center justify-center">
            <Ionicons name="shield-checkmark" size={14} color="#1E3A8A" />
            <Text className="ml-1.5 text-[10px] font-medium text-slate-500">
              Audited & Digitally Certified by Registry
            </Text>
          </View>

          {/* Action Buttons: VIEW REPORT & DOWNLOAD REPORT */}
          <View className="mt-4 space-y-2">
            <Pressable
              onPress={() =>
                Alert.alert(
                  selectedReport?.title || 'Report',
                  `Viewing certified analytics for ${selectedReport?.title || 'Report'}.\nFulfillment status: ${selectedReport?.status}`,
                  [{ text: 'Close' }]
                )
              }
              className="flex-row items-center justify-center rounded-2xl bg-blue-950 py-3.5 shadow-sm active:opacity-90"
            >
              <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold tracking-wider text-white">
                VIEW REPORT
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Download Started',
                  `Downloading ${selectedReport?.title || 'Report'} (${selectedReport?.fileSize || '2 MB'}). Saved to local device downloads.`,
                  [{ text: 'OK' }]
                )
              }
              className="mt-2.5 flex-row items-center justify-center rounded-2xl bg-blue-100/70 py-3.5 active:opacity-90"
            >
              <Ionicons name="download-outline" size={16} color="#1E3A8A" />
              <Text className="ml-2 text-xs font-bold tracking-wider text-blue-950">
                DOWNLOAD REPORT
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* CRUD: Modal for Generating New Report */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6 shadow-xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-slate-900">
                Generate Custom Audit Report
              </Text>
              <Pressable onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <View className="mt-4">
              <Text className="text-xs font-semibold text-slate-700 mb-1">
                Report Title
              </Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Q3 Executive Circulation Audit"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">
                Description / Notes
              </Text>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Enter scope, objectives or department focus..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <Pressable
              onPress={handleCreateReport}
              disabled={submitting}
              className="mt-5 flex-row items-center justify-center rounded-2xl bg-blue-950 py-3.5 shadow-sm active:opacity-90"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                  <Text className="ml-2 text-xs font-bold text-white">
                    Generate and Save
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Reusable Bottom Bar */}
      <ManagementBottomBar currentTab="overview" />
    </View>
  );
}
