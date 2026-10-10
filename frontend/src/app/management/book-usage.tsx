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
  View,
} from 'react-native';
import { ManagementBottomBar } from '@/components/management-bottom-bar';
import { ManagementHeader } from '@/components/management-header';
import { API_BASE_URL } from '@/constants/api';

type BookUsageData = {
  period: string;
  totalBooks: number;
  circulatedVolumes: number;
  growthVsAug: string;
  regularLoans: number;
  courseReserves: number;
  topCategories: {
    code: string;
    name: string;
    count: number;
    unit: string;
    pct: number;
  }[];
  usageTrend: {
    type: string;
    weeks: { week: string; count: number; heightPct: number }[];
    note: string;
  };
};

export default function BookUsageScreen() {
  const [data, setData] = useState<BookUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'Weekly' | 'Monthly' | 'Semester'>('Monthly');
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [selectedPeriodName, setSelectedPeriodName] = useState('September 2026');

  const loadData = useCallback(async (filterType: 'Weekly' | 'Monthly' | 'Semester') => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/management/book-usage?period=${filterType.toLowerCase()}`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();
      setData(result);
    } catch (err) {
      // Dynamic fallback matching selected filter
      if (filterType === 'Weekly') {
        setData({
          period: 'Sep 15 – Sep 21, 2026',
          totalBooks: 1248,
          circulatedVolumes: 310,
          growthVsAug: '+6.2% vs last week',
          regularLoans: 245,
          courseReserves: 65,
          topCategories: [
            { code: 'CS-301', name: 'Database Systems', count: 88, unit: 'vol', pct: 100 },
            { code: 'CS-102', name: 'Programming Languages', count: 74, unit: 'vol', pct: 84 },
            { code: 'CS-204', name: 'Operating Systems', count: 52, unit: 'vol', pct: 59 },
            { code: 'CS-201', name: 'Algorithms & Data Struct', count: 46, unit: 'vol', pct: 52 },
          ],
          usageTrend: {
            type: 'Daily volume (7 days)',
            weeks: [
              { week: 'Mon', count: 48, heightPct: 65 },
              { week: 'Tue', count: 56, heightPct: 76 },
              { week: 'Wed', count: 72, heightPct: 100 },
              { week: 'Thu', count: 52, heightPct: 70 },
              { week: 'Fri', count: 42, heightPct: 56 },
              { week: 'Sat', count: 26, heightPct: 35 },
              { week: 'Sun', count: 14, heightPct: 20 },
            ],
            note: 'Peak borrowing observed on Wednesday ahead of laboratory submissions.',
          },
        });
      } else if (filterType === 'Semester') {
        setData({
          period: 'Semester 2 (2026)',
          totalBooks: 1248,
          circulatedVolumes: 5620,
          growthVsAug: '+18.5% YoY Term',
          regularLoans: 4420,
          courseReserves: 1200,
          topCategories: [
            { code: 'CS-301', name: 'Database Systems', count: 1420, unit: 'vol', pct: 100 },
            { code: 'CS-102', name: 'Programming Languages', count: 1180, unit: 'vol', pct: 83 },
            { code: 'CS-204', name: 'Operating Systems', count: 980, unit: 'vol', pct: 69 },
            { code: 'CS-201', name: 'Algorithms & Data Struct', count: 840, unit: 'vol', pct: 59 },
          ],
          usageTrend: {
            type: 'Term monthly progression',
            weeks: [
              { week: 'Jul', count: 850, heightPct: 48 },
              { week: 'Aug', count: 1120, heightPct: 64 },
              { week: 'Sep', count: 1480, heightPct: 84 },
              { week: 'Oct', count: 1750, heightPct: 100 },
              { week: 'Nov', count: 420, heightPct: 24 },
            ],
            note: 'Highest circulation surge projected in October during final coursework submissions.',
          },
        });
      } else {
        // Monthly
        setData({
          period: 'Sep 2026',
          totalBooks: 1248,
          circulatedVolumes: 1248,
          growthVsAug: '+12.4% vs Aug',
          regularLoans: 1012,
          courseReserves: 236,
          topCategories: [
            { code: 'CS-301', name: 'Database Systems', count: 284, unit: 'vol', pct: 100 },
            { code: 'CS-102', name: 'Programming Languages', count: 231, unit: 'vol', pct: 81 },
            { code: 'CS-204', name: 'Operating Systems', count: 195, unit: 'vol', pct: 68 },
            { code: 'CS-201', name: 'Algorithms & Data Struct', count: 164, unit: 'vol', pct: 58 },
          ],
          usageTrend: {
            type: 'Weekly count (Sep 2026)',
            weeks: [
              { week: 'Wk 1', count: 260, heightPct: 65 },
              { week: 'Wk 2', count: 310, heightPct: 78 },
              { week: 'Wk 3', count: 358, heightPct: 100 },
              { week: 'Wk 4', count: 300, heightPct: 75 },
            ],
            note: 'Peak loan circulation coincided with Midterm Prep (Week 3).',
          },
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  void loadData('Monthly');
}, [loadData]);

  const handleFilterChange = (tab: 'Weekly' | 'Monthly' | 'Semester') => {
  setSelectedFilter(tab);

  if (tab === 'Weekly') {
    setSelectedPeriodName('Current Week (Sep 15–21)');
  } else if (tab === 'Monthly') {
    setSelectedPeriodName('September 2026');
  } else {
    setSelectedPeriodName('Semester 2 (2026)');
  }

  void loadData(tab);
};

  const handleExport = async () => {
  try {
    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #0f172a;
            }

            h1 {
              color: #172554;
              margin-bottom: 5px;
            }

            .subtitle {
              color: #64748b;
              margin-bottom: 25px;
            }

            .card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              margin-bottom: 12px;
              border-radius: 8px;
            }

            .value {
              font-size: 22px;
              font-weight: bold;
              color: #172554;
            }

            .footer {
              margin-top: 30px;
              border-top: 1px solid #cbd5e1;
              padding-top: 15px;
              color: #64748b;
              font-size: 12px;
            }
          </style>
        </head>

        <body>
          <h1>Book Usage Report</h1>

          <div class="subtitle">
            Library Management • Catalog Circulation Analytics
          </div>

          <div class="card">
            <strong>Report Period</strong><br>
            ${data?.period || selectedPeriodName}
          </div>

          <div class="card">
            <strong>Total Book Circulation</strong><br>
            <span class="value">
              ${data?.circulatedVolumes?.toLocaleString() || '0'}
            </span>
          </div>

          <div class="card">
            <strong>Regular Loans</strong><br>
            <span class="value">${data?.regularLoans || 0}</span>
          </div>

          <div class="card">
            <strong>Course Reserves</strong><br>
            <span class="value">${data?.courseReserves || 0}</span>
          </div>

          <div class="card">
            <strong>Growth</strong><br>
            ${data?.growthVsAug || 'N/A'}
          </div>

          <div class="footer">
            Certified Library Management Report<br>
            LIB-USAGE-${selectedFilter.toUpperCase()}-2026
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Save Book Usage Report`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Created', `PDF created at: ${uri}`);
    }
  } catch (error) {
    console.error('PDF export error:', error);
    Alert.alert('Error', 'Could not create the PDF.');
  }
};

  return (
    <View className="flex-1 bg-slate-50">
      <ManagementHeader
        title="Management"
        subtitle="Catalog Circulation Analytics"
        showBackButton={true}
        badgeLabel="USAGE"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 95 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadData(selectedFilter); }} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          {/* Breadcrumb & Period */}
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                LIBRARY MANAGEMENT • CATALOG CIRCULATION
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-900">
                Book Usage
              </Text>
            </View>

            <View className="flex-row items-center rounded-xl bg-blue-50 px-3 py-1.5 border border-blue-200">
              <Ionicons name="calendar-outline" size={13} color="#1E3A8A" />
              <Text className="ml-1.5 text-xs font-bold text-blue-950">
                {data?.period || selectedPeriodName}
              </Text>
            </View>
          </View>

          {/* Card: Total Book Usage */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                TOTAL BOOK CIRCULATION
              </Text>
              <View className="rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                <Text className="text-xs font-bold text-emerald-800">
                  {data?.growthVsAug || '+12.4% vs Aug'}
                </Text>
              </View>
            </View>

            <View className="mt-2.5 flex-row items-baseline">
              <Text className="text-3xl font-black tracking-tight text-blue-950">
                {data?.circulatedVolumes?.toLocaleString() || '1,248'}
              </Text>
              <Text className="ml-2 text-xs font-semibold text-slate-500">
                Volumes ({selectedFilter.toLowerCase()} aggregate)
              </Text>
            </View>

            <View className="mt-3.5 flex-row items-center pt-2.5 border-t border-slate-100">
              <View className="flex-row items-center bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-100">
                <View className="h-2.5 w-2.5 rounded-full bg-blue-700" />
                <Text className="ml-2 text-xs font-medium text-slate-700">
                  <Text className="font-bold text-blue-950">{data?.regularLoans || 1012}</Text> Regular Loans
                </Text>
              </View>
              <View className="ml-2.5 flex-row items-center bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-100">
                <View className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <Text className="ml-2 text-xs font-medium text-slate-700">
                  <Text className="font-bold text-emerald-950">{data?.courseReserves || 236}</Text> Reserves
                </Text>
              </View>
            </View>
          </View>

          {/* Card: Top Categories with Colorful Badges */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-blue-100 mr-2">
                  <Ionicons name="book" size={16} color="#1E3A8A" />
                </View>
                <Text className="text-sm font-bold text-slate-900">
                  Top Catalog Categories
                </Text>
              </View>
              <Text className="text-xs font-semibold text-slate-500">Demand Level</Text>
            </View>

            <View className="mt-3.5 space-y-3">
              {data?.topCategories?.map((cat, idx) => {
                const PALETTES = [
                  { bar: '#2563EB', bg: 'bg-blue-50', text: 'text-blue-800' },
                  { bar: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-800' },
                  { bar: '#7C3AED', bg: 'bg-purple-50', text: 'text-purple-800' },
                  { bar: '#D97706', bg: 'bg-amber-50', text: 'text-amber-800' },
                  { bar: '#DC2626', bg: 'bg-rose-50', text: 'text-rose-800' },
                ];
                const theme = PALETTES[idx % PALETTES.length];

                return (
                  <View key={cat.code} className="mb-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className={`rounded-md ${theme.bg} px-2 py-0.5 mr-2`}>
                          <Text className={`text-[10px] font-black ${theme.text}`}>
                            {cat.code}
                          </Text>
                        </View>
                        <Text className="text-xs font-bold text-slate-800">
                          {cat.name}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-slate-900">
                        {cat.count} <Text className="text-xs font-normal text-slate-500">{cat.unit}</Text>
                      </Text>
                    </View>
                    <View className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${cat.pct}%`, backgroundColor: theme.bar }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card: Usage Trend with Colorful Bars */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 mr-2">
                  <Ionicons name="bar-chart" size={16} color="#4338CA" />
                </View>
                <Text className="text-sm font-bold text-slate-900">
                  CIRCULATION TREND
                </Text>
              </View>
              <View className="rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200">
                <Text className="text-xs font-bold text-blue-900">
                  {data?.usageTrend?.type || `${selectedFilter} trend`}
                </Text>
              </View>
            </View>

            {/* Dynamic Bars with Vibrant Colors & Labels */}
            <View className="mt-6 flex-row items-end justify-between px-2">
              {data?.usageTrend?.weeks?.map((wk, idx) => {
                const maxPct = Math.max(...(data?.usageTrend?.weeks?.map((w) => w.heightPct) || [100]));
                const isPeak = wk.heightPct === maxPct;
                const barColor = isPeak ? '#1E3A8A' : idx % 2 === 0 ? '#3B82F6' : '#60A5FA';

                return (
                  <View key={wk.week} className="items-center flex-1 px-1">
                    <Text className={`mb-1.5 text-xs ${isPeak ? 'font-black text-blue-950' : 'font-bold text-slate-600'}`}>
                      {wk.count}
                    </Text>
                    <View
                      className="w-full max-w-[42px] rounded-t-lg shadow-sm"
                      style={{
                        height: Math.max(18, wk.heightPct * 0.95),
                        backgroundColor: barColor,
                      }}
                    />
                    <Text
                      className={`mt-2 text-xs ${
                        isPeak ? 'font-black text-blue-950 underline' : 'text-slate-600 font-semibold'
                      }`}
                    >
                      {wk.week}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className="mt-5 flex-row items-center rounded-xl bg-blue-50 p-3 border border-blue-100">
              <Ionicons name="information-circle" size={17} color="#1E3A8A" />
              <Text className="ml-2 flex-1 text-xs font-medium text-slate-700 leading-4">
               {data?.usageTrend?.note ||
  'Peak loan circulation coincided with Midterm Prep cycle.'}
              </Text>
            </View>
          </View>

          {/* Filter Period Box with interactive tabs */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-900">
                Filter Period
              </Text>
              <Text className="text-xs font-semibold text-blue-900">
                Academic Term 2026/27
              </Text>
            </View>

            {/* Tabs: Weekly, Monthly, Semester */}
            <View className="mt-3.5 flex-row rounded-xl bg-slate-100 p-1">
              {(['Weekly', 'Monthly', 'Semester'] as const).map((tab) => {
                const active = selectedFilter === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => handleFilterChange(tab)}
                    className={`flex-1 items-center rounded-lg py-2.5 ${
                      active ? 'bg-blue-950 shadow-sm' : ''
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        active ? 'font-bold text-white' : 'font-medium text-slate-600'
                      }`}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Dropdown Selector - Interactive */}
            <Pressable
              onPress={() => setPeriodModalVisible(true)}
              className="mt-3.5 flex-row items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 active:opacity-80"
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={16} color="#1E3A8A" />
                <Text className="ml-2.5 text-sm font-bold text-slate-900">
                  {selectedPeriodName}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-blue-800 mr-1.5">Change</Text>
                <Ionicons name="chevron-down" size={15} color="#1E3A8A" />
              </View>
            </Pressable>

            {/* Export Usage Summary Button */}
            <Pressable
              onPress={handleExport}
              className="mt-4 flex-row items-center justify-center rounded-2xl bg-blue-950 py-4 shadow-sm active:opacity-90"
            >
              <Ionicons name="download" size={17} color="#FFFFFF" />
              <Text className="ml-2 text-sm font-bold tracking-wide text-white">
                Export Usage Summary ({selectedFilter})
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Period Picker Modal */}
      <Modal
        visible={periodModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodModalVisible(false)}
      >
        <Pressable
          onPress={() => setPeriodModalVisible(false)}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View className="rounded-3xl bg-white p-5 shadow-2xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <View className="flex-row items-center">
                <Ionicons name="time" size={18} color="#1E3A8A" />
                <Text className="ml-2 text-sm font-bold text-slate-900">Select Audit Period</Text>
              </View>
              <Pressable onPress={() => setPeriodModalVisible(false)}>
                <Ionicons name="close-circle" size={22} color="#94A3B8" />
              </Pressable>
            </View>

            <View className="mt-3 space-y-2">
              {[
                { title: 'Current Week (Sep 15–21, 2026)', mode: 'Weekly' as const },
                { title: 'September 2026 (Active Cycle)', mode: 'Monthly' as const },
                { title: 'August 2026 (Archived Cycle)', mode: 'Monthly' as const },
                { title: 'Semester 2 (2026) Complete Term', mode: 'Semester' as const },
              ].map((opt) => (
                <Pressable
                  key={opt.title}
                  onPress={() => {
                    setSelectedPeriodName(opt.title);
                    handleFilterChange(opt.mode);
                    setPeriodModalVisible(false);
                  }}
                  className={`flex-row items-center justify-between rounded-2xl p-3.5 my-1 border ${
                    selectedPeriodName === opt.title ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-xs ${selectedPeriodName === opt.title ? 'font-bold text-blue-950' : 'font-medium text-slate-700'}`}>
                    {opt.title}
                  </Text>
                  {selectedPeriodName === opt.title && (
                    <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Reusable Bottom Bar */}
      <ManagementBottomBar currentTab="usage" />
    </View>
  );
}