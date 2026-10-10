import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import { ManagementHeader } from '@/components/management-header';
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
  summary?: string;
  keyMetrics?: { label: string; value: string }[];
  signOff?: string;
  certId?: string;
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

  // Document Viewer & Download State
  const [documentViewerVisible, setDocumentViewerVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Fetch reports (CRUD: Read)
  const loadReports = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/management/reports`);
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
          status: 'Audited & Verified',
          description:
            'Monthly circulation, category breakdown, and shelf checkout frequencies across all faculties.',
          audited: true,
          summary: 'Total book loans reached 1,248 volumes during September 2026, marking a 12.4% increase over August. Computer Science (Database Systems & Programming) formed 68% of loans, with a 98.4% timely return rate.',
          keyMetrics: [
            { label: 'Circulated Volumes', value: '1,248 vol' },
            { label: 'Regular Loans', value: '1,012 vol' },
            { label: 'Course Reserves', value: '236 vol' },
            { label: 'Overdue Rate', value: '1.6%' },
          ],
          signOff: 'Prof. Asanka Wijesinghe (Chief Librarian)',
          certId: 'CERT-LIB-2026-09A',
        },
        {
          id: 'rep-2',
          title: 'Reservation Report',
          type: 'reservation',
          period: 'September 2026',
          updatedDate: '20 Sep 2026',
          fileSize: '1.8 MB',
          status: 'Audited & Verified',
          description:
            'Hold queues, confirmation ratios, student pickups, and cancellation logs.',
          audited: true,
          summary: '326 reservation requests were submitted across catalog books and reading desks. 284 reservations were fulfilled within scheduled pickup windows (87.1% fulfillment rate), while 42 were cancelled.',
          keyMetrics: [
            { label: 'Fulfillment Rate', value: '87.1%' },
            { label: 'Confirmed Bookings', value: '284' },
            { label: 'Cancelled / Expired', value: '42' },
            { label: 'Average Lead Time', value: '4.2 hrs' },
          ],
          signOff: 'Mrs. A.W. Chamodya (Assistant Librarian)',
          certId: 'CERT-LIB-2026-09B',
        },
        {
          id: 'rep-3',
          title: 'Seat Occupancy Report',
          type: 'seat-occupancy',
          period: 'September 2026',
          updatedDate: '20 Sep 2026',
          fileSize: '1.6 MB',
          status: 'Audited & Verified',
          description:
            'Reading Room A & B hourly density, peak utilization, and desk turn rates.',
          audited: true,
          summary: 'Overall reading desk occupancy averaged 78% during September. Reading Room A (Quiet Zone) sustained 84% average occupancy with peak usage between 11:00 AM and 03:00 PM. No entrance queuing conflicts were recorded.',
          keyMetrics: [
            { label: 'Peak Capacity', value: '92%' },
            { label: 'Active Desks', value: '39 / 50' },
            { label: 'Reading Room A', value: '84% avg' },
            { label: 'Reading Room B', value: '71% avg' },
          ],
          signOff: 'Senate Library Facilities Sub-Committee',
          certId: 'CERT-LIB-2026-09C',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedReportId]);

  useEffect(() => {
    const timer = setTimeout(() => void loadReports(), 0);
    return () => clearTimeout(timer);
  }, [loadReports]);

  // CRUD: Create Report
  const handleCreateReport = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a report title');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/management/reports`, {
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
              await fetch(`${API_BASE_URL}/management/reports/${id}`, { method: 'DELETE' });
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
      await fetch(`${API_BASE_URL}/management/reports/${report.id}`, {
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
  const handleSavePdf = async () => {
  if (!selectedReport) {
    Alert.alert('Error', 'No report selected.');
    return;
  }

  try {
    setIsDownloading(true);

    const metricsHtml = (selectedReport.keyMetrics || [])
      .map(
        (metric) => `
          <div class="metric">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
          </div>
        `
      )
      .join('');

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #0f172a;
            }

            .header {
              text-align: center;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 20px;
            }

            h1 {
              font-size: 22px;
              margin-bottom: 5px;
            }

            .sub {
              color: #64748b;
              font-size: 13px;
            }

            .meta {
              margin-top: 25px;
              padding: 15px;
              background: #f8fafc;
              border-radius: 10px;
            }

            .title {
              margin-top: 30px;
              font-size: 24px;
              font-weight: bold;
            }

            .summary {
              margin-top: 20px;
              padding: 18px;
              background: #eff6ff;
              border-radius: 10px;
              line-height: 1.6;
            }

            .metrics {
              margin-top: 25px;
            }

            .metric {
              margin-bottom: 10px;
              padding: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }

            .metric-label {
              color: #64748b;
              font-size: 12px;
            }

            .metric-value {
              font-size: 18px;
              font-weight: bold;
              margin-top: 4px;
            }

            .sign {
              margin-top: 35px;
              border-top: 1px solid #cbd5e1;
              padding-top: 15px;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <h1>SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY</h1>
            <div class="sub">
              CENTRAL LIBRARY GOVERNANCE & ARCHIVAL BOARD
            </div>
          </div>

          <div class="meta">
            <strong>Period:</strong> ${selectedReport.period}<br>
            <strong>Status:</strong> ${selectedReport.status}<br>
            <strong>Certificate ID:</strong> ${selectedReport.certId || 'N/A'}
          </div>

          <div class="title">${selectedReport.title}</div>

          <p>${selectedReport.description}</p>

          <div class="summary">
            <strong>EXECUTIVE SUMMARY & FINDINGS</strong>
            <p>
              ${
                selectedReport.summary ||
                'Comprehensive library management report.'
              }
            </p>
          </div>

          <div class="metrics">
            <h3>KEY AUDIT INDICES</h3>
            ${metricsHtml}
          </div>

          <div class="sign">
            <strong>CERTIFIED SIGN-OFF</strong><br><br>
            ${selectedReport.signOff || 'University Library Management'}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Library Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Created', `PDF created at: ${uri}`);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    Alert.alert('Error', 'Could not generate the PDF.');
  } finally {
    setIsDownloading(false);
  }
};

  return (
    <View className="flex-1 bg-slate-50">
      <ManagementHeader
        title="Management Reports"
        subtitle="Audit Logs & Compliance Archives"
        showBackButton={true}
        badgeLabel="AUDIT"
      />

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
        <View className="px-4 pt-4">
          {/* Top Meta info */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full bg-blue-50 px-3.5 py-1.5 border border-blue-200">
              <Text className="text-xs font-bold text-blue-900">
                EXECUTIVE ARCHIVE
              </Text>
              <Text className="mx-1.5 text-xs text-blue-400">•</Text>
              <Text className="text-xs font-semibold text-blue-800">
                LIBRARY MANAGEMENT
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="code-working" size={14} color="#64748B" />
              <Text className="ml-1 text-xs font-semibold text-slate-500">
                v2.6
              </Text>
            </View>
          </View>

          <Text className="mt-2 text-sm text-slate-500">
            Library Management Audit & Summaries
          </Text>

          {/* Report Period Selector Card */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                REPORT PERIOD
              </Text>
              <View className="flex-row items-center rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200">
                <View className="h-2 w-2 rounded-full bg-blue-700 mr-1.5" />
                <Text className="text-xs font-bold text-blue-900">
                  Active Session
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Ionicons name="calendar-outline" size={20} color="#1E3A8A" />
                </View>
                <View className="ml-3">
                  <Text className="text-base font-bold text-slate-900">
                    {period}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Fall Semester • Cycle M-09
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </View>
          </View>

          {/* Action Row: Generate New Report (CRUD Create) */}
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              AVAILABLE AUDIT REPORTS ({reports.length})
            </Text>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              className="flex-row items-center rounded-xl bg-blue-50 px-3 py-1.5 border border-blue-200 active:opacity-80"
            >
              <Ionicons name="add-circle" size={16} color="#1E3A8A" />
              <Text className="ml-1.5 text-xs font-bold text-blue-950">
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
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-950">
                        <Ionicons name={iconName} size={19} color="#FFFFFF" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-bold text-slate-900">
                          {item.title}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
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

                  <Text className="mt-2.5 text-xs leading-5 text-slate-600">
                    {item.description}
                  </Text>

                  <View className="mt-3.5 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <View className="flex-row items-center">
                      <View className="rounded-md bg-slate-100 px-2 py-0.5 border border-slate-200">
                        <Text className="text-xs font-bold text-slate-600">
                          PDF • {item.fileSize}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleToggleAudit(item)}
                        className="ml-2.5"
                      >
                        <Text className="text-xs font-bold text-blue-900">
                          {item.status} &gt;
                        </Text>
                      </Pressable>
                    </View>

                    {/* Delete Option (CRUD Delete) */}
                    <Pressable
                      onPress={() => handleDeleteReport(item.id, item.title)}
                      className="p-1"
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Audited Registry Notice */}
          <View className="mt-3.5 flex-row items-center justify-center">
            <Ionicons name="shield-checkmark" size={16} color="#1E3A8A" />
            <Text className="ml-1.5 text-xs font-semibold text-slate-500">
              Audited & Digitally Certified by Registry Council
            </Text>
          </View>

          {/* Action Buttons: VIEW REPORT & DOWNLOAD REPORT */}
          <View className="mt-4 space-y-2.5">
            <Pressable
              onPress={() => setDocumentViewerVisible(true)}
              className="flex-row items-center justify-center rounded-2xl bg-blue-950 py-4 shadow-sm active:opacity-90"
            >
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text className="ml-2 text-sm font-bold tracking-wider text-white">
                VIEW REPORT
              </Text>
            </Pressable>

            <Pressable
  onPress={handleSavePdf}
  disabled={isDownloading}
              className="mt-2.5 flex-row items-center justify-center rounded-2xl bg-blue-100 py-4 border border-blue-200 active:opacity-90"
            >
              {isDownloading ? (
                <ActivityIndicator color="#1E3A8A" size="small" />
              ) : (
                <>
                  <Ionicons name="download" size={18} color="#1E3A8A" />
                  <Text className="ml-2 text-sm font-bold tracking-wider text-blue-950">
                    DOWNLOAD REPORT (PDF)
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* FULL DOCUMENT VIEWER MODAL */}
      <Modal
        visible={documentViewerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDocumentViewerVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="h-[90%] rounded-t-3xl bg-white shadow-2xl flex-col">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl">
              <View className="flex-row items-center">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-blue-950">
                  <Ionicons name="document-text" size={16} color="#FFFFFF" />
                </View>
                <View className="ml-2.5">
                  <Text className="text-xs font-bold text-slate-900">Official Document Preview</Text>
                  <Text className="text-[10px] text-slate-500">{selectedReport?.certId || 'CERT-LIB-2026-09A'}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDocumentViewerVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-200 active:opacity-70"
              >
                <Ionicons name="close" size={18} color="#0F172A" />
              </Pressable>
            </View>

            {/* Document Body (Paper simulation) */}
            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
              {/* Institutional Paper Sheet */}
              <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* University Header */}
                <View className="items-center pb-4 border-b border-slate-200">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 mb-2">
                    <Ionicons name="library" size={24} color="#FFFFFF" />
                  </View>
                  <Text className="text-sm font-black uppercase tracking-wider text-slate-900 text-center">
                    SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY
                  </Text>
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mt-0.5">
                    CENTRAL LIBRARY GOVERNANCE & ARCHIVAL BOARD
                  </Text>
                </View>

                {/* Metadata Row */}
                <View className="mt-4 flex-row items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <View>
                    <Text className="text-[10px] uppercase font-bold text-slate-400">PERIOD</Text>
                    <Text className="text-xs font-bold text-slate-800">{selectedReport?.period || period}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] uppercase font-bold text-slate-400">STATUS</Text>
                    <Text className="text-xs font-bold text-emerald-700">● {selectedReport?.status || 'Certified'}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] uppercase font-bold text-slate-400">FILE TYPE</Text>
                    <Text className="text-xs font-bold text-blue-950">PDF • {selectedReport?.fileSize || '1.4 MB'}</Text>
                  </View>
                </View>

                {/* Report Title */}
                <View className="mt-5">
                  <Text className="text-lg font-black text-slate-950">
                    {selectedReport?.title}
                  </Text>
                  <Text className="text-xs text-slate-600 mt-1 leading-5">
                    {selectedReport?.description}
                  </Text>
                </View>

                {/* Executive Summary */}
                <View className="mt-4 rounded-xl bg-blue-50/70 p-4 border border-blue-100">
                  <Text className="text-xs font-bold uppercase tracking-wider text-blue-950 mb-1.5">
                    EXECUTIVE SUMMARY & FINDINGS
                  </Text>
                  <Text className="text-sm text-slate-700 leading-6">
                    {selectedReport?.summary ||
                      'Comprehensive telemetry compilation reflecting student checkouts, room density, and reservation operations during the academic cycle.'}
                  </Text>
                </View>

                {/* Key Metrics Grid */}
                <View className="mt-4">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    KEY AUDIT INDICES
                  </Text>
                  <View className="flex-row flex-wrap justify-between">
                    {(
                      selectedReport?.keyMetrics || [
                        { label: 'Circulation Vol', value: '1,248 vol' },
                        { label: 'Fulfillment Rate', value: '87.1%' },
                        { label: 'Desk Occupancy', value: '78%' },
                        { label: 'Audit Integrity', value: '100% OK' },
                      ]
                    ).map((m, i) => (
                      <View key={i} className="w-[48%] bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                        <Text className="text-xs font-semibold text-slate-500 uppercase">{m.label}</Text>
                        <Text className="text-base font-black text-blue-950 mt-0.5">{m.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Digital Verification & Stamp */}
                <View className="mt-5 pt-4 border-t border-dashed border-slate-200 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] uppercase font-bold text-slate-400">CERTIFIED SIGN-OFF</Text>
                    <Text className="text-sm font-bold text-slate-800 mt-0.5">
                      {selectedReport?.signOff || 'Prof. Asanka Wijesinghe'}
                    </Text>
                    <Text className="text-xs text-slate-500">Chief Librarian / University Management</Text>
                  </View>
                  <View className="items-center justify-center rounded-xl bg-emerald-50 px-3 py-1.5 border border-emerald-300">
                    <Ionicons name="shield-checkmark" size={20} color="#059669" />
                    <Text className="text-[9px] font-black text-emerald-800 uppercase mt-0.5">SEAL VERIFIED</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Viewer Bottom Actions */}
            <View className="p-4 border-t border-slate-100 bg-white flex-row space-x-3">
              <Pressable
  onPress={handleSavePdf}
                className="flex-1 flex-row items-center justify-center rounded-2xl bg-blue-950 py-4 shadow-sm active:opacity-90 mr-2"
              >
                <Ionicons name="download" size={17} color="#FFFFFF" />
                <Text className="ml-2 text-sm font-bold text-white">Save PDF</Text>
              </Pressable>

              <Pressable
                onPress={() => setDocumentViewerVisible(false)}
                className="flex-1 flex-row items-center justify-center rounded-2xl bg-slate-100 py-4 active:opacity-80"
              >
                <Text className="text-sm font-bold text-slate-800">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
