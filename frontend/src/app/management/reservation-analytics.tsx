import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ManagementBottomBar } from '@/components/management-bottom-bar';
import { ManagementHeader } from '@/components/management-header';
import { API_BASE_URL } from '@/constants/api';

type ReservationAnalyticsData = {
  period: string;
  totalBookings: number;
  subTitle: string;
  growthVsAug: string;
  capacityStatus: string;
  statusBreakdown: {
    fulfillmentRate: string;
    confirmed: number;
    confirmedPct: number;
    cancelled: number;
    cancelledPct: number;
  };
  weeklyDistribution: {
    week: string;
    confirmed: number;
    cancelled: number;
    confHeight: number;
    cancHeight: number;
  }[];
  weeklyHighlights: {
    peak: string;
    dailyAvg: string;
  };
  leadTime: {
    value: string;
    label: string;
  };
  peakDays: {
    value: string;
    label: string;
  };
};

export default function ReservationAnalyticsScreen() {
  const [data, setData] = useState<ReservationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/management/reservation-analytics`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();
      setData(result);
    } catch (_err) {
      // Fallback matching Figma specs
      setData({
        period: 'September 2026',
        totalBookings: 326,
        subTitle: 'Total reservations requested',
        growthVsAug: '+14.2% from August',
        capacityStatus: '100% capacity cap active',
        statusBreakdown: {
          fulfillmentRate: '87.1% Fulfillment Rate',
          confirmed: 284,
          confirmedPct: 87,
          cancelled: 42,
          cancelledPct: 13,
        },
        weeklyDistribution: [
          { week: 'W1', confirmed: 72, cancelled: 10, confHeight: 70, cancHeight: 15 },
          { week: 'W2', confirmed: 82, cancelled: 12, confHeight: 82, cancHeight: 18 },
          { week: 'W3', confirmed: 96, cancelled: 14, confHeight: 96, cancHeight: 20 },
          { week: 'W4', confirmed: 74, cancelled: 8, confHeight: 74, cancHeight: 12 },
        ],
        weeklyHighlights: {
          peak: 'Peak: Week 3 (96 total)',
          dailyAvg: '24.2 / day avg',
        },
        leadTime: {
          value: '4.2 hrs',
          label: 'Average reservation advance',
        },
        peakDays: {
          value: 'Mon – Wed',
          label: '62% of weekly check-ins',
        },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ManagementHeader
        title="Management"
        subtitle="Reservation Queue Metrics"
        showBackButton={true}
        badgeLabel="HOLDS"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 95 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          {/* Breadcrumb & Period */}
          <Text className="text-xs font-bold uppercase tracking-wider text-blue-900">
            LIBRARY MANAGEMENT • QUEUE METRICS
          </Text>
          <Text className="mt-1 text-2xl font-black text-slate-900">
            Reservations Analytics
          </Text>

          {/* Month Tag */}
          <View className="mt-2.5 flex-row items-center self-start rounded-xl bg-blue-50 px-3 py-1.5 border border-blue-200">
            <Ionicons name="calendar-outline" size={14} color="#1E3A8A" />
            <Text className="ml-1.5 text-xs font-bold text-blue-950">
              {data?.period || 'September 2026'}
            </Text>
          </View>

          {/* Card 1: Total Bookings */}
          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  TOTAL RESERVATIONS
                </Text>
                <View className="mt-1 flex-row items-baseline">
                  <Text className="text-3xl font-black tracking-tight text-blue-950">
                    {data?.totalBookings || 326}
                  </Text>
                  <Text className="ml-2 text-sm font-semibold text-slate-500">Bookings</Text>
                </View>
                <Text className="mt-1 text-xs font-medium text-slate-600">
                  {data?.subTitle || 'Total reservations requested across catalog'}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                <Ionicons name="calendar" size={20} color="#1E3A8A" />
              </View>
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <View className="flex-row items-center bg-blue-50/70 px-2.5 py-1 rounded-lg">
                <Ionicons name="trending-up" size={15} color="#2563EB" />
                <Text className="ml-1 text-xs font-bold text-blue-900">
                  {data?.growthVsAug || '+14.2% from August'}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-slate-500">
                {data?.capacityStatus || '100% capacity cap active'}
              </Text>
            </View>
          </View>

          {/* Card 2: Status Breakdown */}
          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                STATUS BREAKDOWN
              </Text>
              <View className="rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                <Text className="text-xs font-bold text-emerald-800">
                  {data?.statusBreakdown?.fulfillmentRate || '87.1% Fulfillment'}
                </Text>
              </View>
            </View>

            {/* Confirmed vs Cancelled stats */}
            <View className="mt-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100 flex-1 mr-2">
                <View className="mr-2.5 h-3 w-3 rounded-full bg-emerald-500" />
                <View>
                  <Text className="text-xs font-semibold text-emerald-900">Confirmed</Text>
                  <Text className="text-lg font-black text-slate-900">
                    {data?.statusBreakdown?.confirmed ?? 284}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-100 flex-1 ml-2">
                <View className="mr-2.5 h-3 w-3 rounded-full bg-amber-500" />
                <View>
                  <Text className="text-xs font-semibold text-amber-900">Cancelled</Text>
                  <Text className="text-lg font-black text-slate-900">
                    {data?.statusBreakdown?.cancelled ?? 42}
                  </Text>
                </View>
              </View>
            </View>

            {/* Split Progress Bar - Matching Vibrant Semantic Colors */}
            <View className="mt-4 h-3 w-full flex-row overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full bg-emerald-500 rounded-l-full"
                style={{ width: `${data?.statusBreakdown?.confirmedPct || 87}%` }}
              />
              <View
                className="h-full bg-amber-500 rounded-r-full"
                style={{ width: `${data?.statusBreakdown?.cancelledPct || 13}%` }}
              />
            </View>

            <View className="mt-2.5 flex-row justify-between">
              <View className="flex-row items-center">
                <View className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-xs font-bold text-emerald-800">
                  {data?.statusBreakdown?.confirmedPct || 87}% Confirmed
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="h-2 w-2 rounded-full bg-amber-500 mr-1.5" />
                <Text className="text-xs font-bold text-amber-800">
                  {data?.statusBreakdown?.cancelledPct || 13}% Cancelled
                </Text>
              </View>
            </View>
          </View>

          {/* Card 3: Reservation Trend Chart */}
          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  RESERVATION TREND
                </Text>
                <Text className="mt-0.5 text-sm font-bold text-slate-900">
                  Weekly Distribution (Sep 1–28)
                </Text>
              </View>

              <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1" />
                <Text className="text-xs font-bold text-slate-700 mr-2.5">Conf.</Text>
                <View className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-1" />
                <Text className="text-xs font-bold text-slate-700">Canc.</Text>
              </View>
            </View>

            {/* 4 Weekly Multi-Bars with Vibrant Colors and Labels */}
            {(() => {
              const weekList =
                data?.weeklyDistribution && data.weeklyDistribution.length > 0
                  ? data.weeklyDistribution
                  : [
                      { week: 'W1', confirmed: 72, cancelled: 10, confHeight: 72, cancHeight: 18 },
                      { week: 'W2', confirmed: 82, cancelled: 12, confHeight: 82, cancHeight: 22 },
                      { week: 'W3', confirmed: 96, cancelled: 14, confHeight: 96, cancHeight: 25 },
                      { week: 'W4', confirmed: 74, cancelled: 8, confHeight: 74, cancHeight: 16 },
                    ];

              return (
                <View className="mt-6 flex-row items-end justify-between px-2">
                  {weekList.map((item, idx) => {
                    const confVal = item.confirmed ?? (item as any).count ?? 70;
                    const cancVal = item.cancelled ?? 10;
                    const confBarH = Math.max(22, (item.confHeight || (confVal / 100) * 85) * 0.95);
                    const cancBarH = Math.max(14, (item.cancHeight || (cancVal / 30) * 45) * 0.95);
                    const weekLabel = item.week || (item as any).day || `W${idx + 1}`;

                    return (
                      <View key={weekLabel} className="items-center flex-1 px-1">
                        <View className="h-32 justify-end items-center">
                          <View className="flex-row items-end justify-center space-x-1.5">
                            <View className="items-center mr-1">
                              <Text className="text-[10px] font-black text-emerald-800 mb-1">
                                {confVal}
                              </Text>
                              <View
                                className="w-4 rounded-t-md bg-emerald-600 shadow-sm"
                                style={{ height: confBarH }}
                              />
                            </View>
                            <View className="items-center">
                              <Text className="text-[10px] font-black text-amber-700 mb-1">
                                {cancVal}
                              </Text>
                              <View
                                className="w-3 rounded-t-md bg-amber-500 shadow-sm"
                                style={{ height: cancBarH }}
                              />
                            </View>
                          </View>
                        </View>
                        <Text className="mt-2 text-xs font-black text-slate-700">
                          {weekLabel}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}

            {/* Peak and Daily Avg Banner */}
            <View className="mt-5 flex-row items-center justify-between rounded-xl bg-blue-50 p-3 border border-blue-100">
              <View className="flex-row items-center">
                <Ionicons name="pulse" size={17} color="#1E3A8A" />
                <Text className="ml-2 text-xs font-bold text-blue-950">
                  {data?.weeklyHighlights?.peak || 'Peak: Week 3 (96 total)'}
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-700">
                {data?.weeklyHighlights?.dailyAvg || '24.2 / day avg'}
              </Text>
            </View>
          </View>

          {/* Cards 4 & 5: Lead Time & Peak Days */}
          <View className="mt-4 flex-row space-x-3">
            <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={15} color="#1E3A8A" />
                <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  LEAD TIME
                </Text>
              </View>
              <Text className="mt-2 text-2xl font-black text-blue-950">
                {data?.leadTime?.value || '4.2 hrs'}
              </Text>
              <Text className="mt-1 text-xs font-medium text-slate-600 leading-4">
                {data?.leadTime?.label || 'Average reservation advance'}
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ml-2">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={15} color="#1E3A8A" />
                <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  PEAK DAYS
                </Text>
              </View>
              <Text className="mt-2 text-2xl font-black text-blue-950">
                {data?.peakDays?.value || 'Mon – Wed'}
              </Text>
              <Text className="mt-1 text-xs font-medium text-slate-600 leading-4">
                {data?.peakDays?.label || '62% of weekly check-ins'}
              </Text>
            </View>
          </View>

          {/* View Details Button */}
          <Pressable
            onPress={() => router.push('/management/reports')}
            className="mt-4 flex-row items-center justify-between rounded-2xl bg-blue-950 px-5 py-4 shadow-sm active:opacity-90"
          >
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text className="ml-2.5 text-sm font-bold text-white tracking-wide">
                View Detailed Reports
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Reusable Bottom Bar */}
      <ManagementBottomBar currentTab="reservations" />
    </View>
  );
}
