import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ManagementBottomBar } from '@/components/management-bottom-bar';
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

  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/book-usage`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();
      setData(result);
    } catch (err) {
      // Fallback matching Figma specs
      setData({
        period: 'Sep 2026',
        totalBooks: 1248,
        circulatedVolumes: 1248,
        growthVsAug: '+12.4% vs Aug',
        regularLoans: 1012,
        courseReserves: 236,
        topCategories: [
          { code: 'CS-301', name: 'Database', count: 284, unit: 'vol', pct: 100 },
          { code: 'CS-102', name: 'Programming', count: 231, unit: 'vol', pct: 81 },
          { code: 'CS-204', name: 'Operating Systems', count: 195, unit: 'vol', pct: 68 },
          { code: 'CS-201', name: 'Algorithms', count: 164, unit: 'vol', pct: 58 },
        ],
        usageTrend: {
          type: 'Weekly count',
          weeks: [
            { week: 'Wk 1', count: 260, heightPct: 65 },
            { week: 'Wk 2', count: 310, heightPct: 78 },
            { week: 'Wk 3', count: 358, heightPct: 100 },
            { week: 'Wk 4', count: 300, heightPct: 75 },
          ],
          note: 'Peak loan circulation coincided with Midterm Prep (Week 3).',
        },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = () => {
    Alert.alert(
      'Export Summary',
      `Catalog circulation summary for ${data?.period || 'Sep 2026'} compiled. Ready for download.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 95 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View className="flex-row items-center justify-between bg-white px-5 pb-3 pt-14 border-b border-slate-100">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </Pressable>
            <View>
              <Text className="text-sm font-bold text-slate-900 leading-tight">
                Management
              </Text>
              <Text className="text-[10px] text-slate-500">
                Library Reports & Analytics
              </Text>
            </View>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-950">
            <Ionicons name="person" size={15} color="#FFFFFF" />
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Breadcrumb & Period */}
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                LIBRARY MANAGEMENT • CATALOG CIRCULATION
              </Text>
              <Text className="mt-0.5 text-xl font-bold text-slate-900">
                Book Usage
              </Text>
            </View>

            <View className="flex-row items-center rounded-xl bg-blue-50 px-2.5 py-1">
              <Ionicons name="calendar-outline" size={12} color="#1E3A8A" />
              <Text className="ml-1 text-[10px] font-bold text-blue-950">
                Sep 2026
              </Text>
            </View>
          </View>

          {/* Card: Total Book Usage */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                TOTAL BOOK USAGE
              </Text>
              <View className="rounded-full bg-blue-50 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-blue-800">
                  {data?.growthVsAug || '+12.4% vs Aug'}
                </Text>
              </View>
            </View>

            <View className="mt-2.5 flex-row items-baseline">
              <Text className="text-3xl font-bold tracking-tight text-blue-950">
                {data?.circulatedVolumes.toLocaleString() || '1,248'}
              </Text>
              <Text className="ml-2 text-xs text-slate-500">
                Circulated volumes this month
              </Text>
            </View>

            <View className="mt-3 flex-row items-center">
              <View className="flex-row items-center">
                <View className="h-2.5 w-2.5 rounded-full bg-blue-950" />
                <Text className="ml-1.5 text-[11px] font-medium text-slate-600">
                  <Text className="font-bold text-slate-900">{data?.regularLoans || 1012}</Text> Regular Loans
                </Text>
              </View>
              <View className="ml-5 flex-row items-center">
                <View className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <Text className="ml-1.5 text-[11px] font-medium text-slate-600">
                  <Text className="font-bold text-slate-900">{data?.courseReserves || 236}</Text> Course Reserves
                </Text>
              </View>
            </View>
          </View>

          {/* Card: Top Categories */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="book-outline" size={15} color="#1E3A8A" />
                <Text className="ml-1.5 text-xs font-bold text-slate-900">
                  Top categories
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400">Volumes</Text>
            </View>

            <View className="mt-3.5 space-y-3">
              {data?.topCategories.map((cat) => (
                <View key={cat.code} className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="rounded bg-blue-50 px-1.5 py-0.5 mr-2">
                        <Text className="text-[9px] font-bold text-blue-900">
                          {cat.code}
                        </Text>
                      </View>
                      <Text className="text-xs font-medium text-slate-800">
                        {cat.name}
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-900">
                      {cat.count} <Text className="text-[10px] font-normal text-slate-400">{cat.unit}</Text>
                    </Text>
                  </View>
                  <View className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-50">
                    <View
                      className="h-full rounded-full bg-blue-950"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Card: Usage Trend */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="bar-chart-outline" size={15} color="#1E3A8A" />
                <Text className="ml-1.5 text-xs font-bold text-slate-900">
                  USAGE TREND
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400">
                {data?.usageTrend.type || 'Weekly count'}
              </Text>
            </View>

            {/* 4 Weekly Bars */}
            <View className="mt-5 flex-row items-end justify-between px-2">
              {data?.usageTrend.weeks.map((wk) => {
                const isPeak = wk.week === 'Wk 3';
                return (
                  <View key={wk.week} className="items-center flex-1">
                    <Text className="mb-1 text-[9px] font-semibold text-slate-500">
                      {wk.count}
                    </Text>
                    <View
                      className={`w-10 rounded-t-md ${
                        isPeak ? 'bg-blue-950' : 'bg-blue-100'
                      }`}
                      style={{ height: wk.heightPct * 0.9 }}
                    />
                    <Text
                      className={`mt-1.5 text-[10px] ${
                        isPeak ? 'font-bold text-blue-950' : 'text-slate-400'
                      }`}
                    >
                      {wk.week}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className="mt-4 flex-row items-center rounded-xl bg-blue-50/70 p-2.5">
              <Ionicons name="information-circle-outline" size={14} color="#1E3A8A" />
              <Text className="ml-2 flex-1 text-[10px] text-slate-600">
                {data?.usageTrend.note ||
                  'Peak loan circulation coincided with Midterm Prep (Week 3).'}
              </Text>
            </View>
          </View>

          {/* Filter Period Box */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-900">
                Filter period
              </Text>
              <Text className="text-[10px] text-slate-400">
                Academic Term 2026/27
              </Text>
            </View>

            {/* Tabs: Weekly, Monthly, Semester */}
            <View className="mt-3 flex-row rounded-xl bg-slate-100 p-1">
              {(['Weekly', 'Monthly', 'Semester'] as const).map((tab) => {
                const active = selectedFilter === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setSelectedFilter(tab)}
                    className={`flex-1 items-center rounded-lg py-1.5 ${
                      active ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        active ? 'font-bold text-blue-950' : 'text-slate-500'
                      }`}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Dropdown Selector */}
            <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text className="ml-2 text-xs font-medium text-slate-800">
                  September 2026
                </Text>
              </View>
              <Ionicons name="swap-vertical" size={14} color="#64748B" />
            </View>

            {/* Export Usage Summary Button */}
            <Pressable
              onPress={handleExport}
              className="mt-3 flex-row items-center justify-center rounded-2xl bg-blue-950 py-3.5 shadow-sm active:opacity-90"
            >
              <Ionicons name="download-outline" size={16} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold tracking-wide text-white">
                Export Usage Summary
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Reusable Bottom Bar */}
      <ManagementBottomBar currentTab="usage" />
    </View>
  );
}