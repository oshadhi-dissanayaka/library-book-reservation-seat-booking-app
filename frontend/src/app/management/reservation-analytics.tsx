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
      const response = await fetch(`${API_BASE_URL}/reservation-analytics`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();
      setData(result);
    } catch (err) {
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
    loadData();
  }, [loadData]);

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
          <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            LIBRARY MANAGEMENT • QUEUE METRICS
          </Text>
          <Text className="mt-0.5 text-xl font-bold text-slate-900">
            Reservations Analytics
          </Text>

          {/* Month Tag */}
          <View className="mt-2.5 flex-row items-center self-start rounded-xl bg-blue-50 px-2.5 py-1">
            <Ionicons name="calendar-outline" size={12} color="#1E3A8A" />
            <Text className="ml-1.5 text-[10px] font-bold text-blue-950">
              September 2026
            </Text>
          </View>

          {/* Card 1: Total Bookings */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  TOTAL
                </Text>
                <View className="mt-1 flex-row items-baseline">
                  <Text className="text-3xl font-bold tracking-tight text-blue-950">
                    {data?.totalBookings || 326}
                  </Text>
                  <Text className="ml-2 text-xs text-slate-500">bookings</Text>
                </View>
                <Text className="mt-1 text-[11px] text-slate-500">
                  {data?.subTitle || 'Total reservations requested'}
                </Text>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons name="calendar" size={18} color="#1E3A8A" />
              </View>
            </View>

            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <View className="flex-row items-center">
                <Ionicons name="trending-up" size={13} color="#2563EB" />
                <Text className="ml-1 text-[11px] font-semibold text-blue-900">
                  {data?.growthVsAug || '+14.2% from August'}
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400">
                {data?.capacityStatus || '100% capacity cap active'}
              </Text>
            </View>
          </View>

          {/* Card 2: Status Breakdown */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                STATUS BREAKDOWN
              </Text>
              <Text className="text-[10px] font-bold text-blue-950">
                {data?.statusBreakdown.fulfillmentRate || '87.1% Fulfillment Rate'}
              </Text>
            </View>

            {/* Confirmed vs Cancelled stats */}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <View>
                  <Text className="text-[10px] text-slate-500">Confirmed</Text>
                  <Text className="text-base font-bold text-slate-900">
                    {data?.statusBreakdown.confirmed || 284}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="mr-2 h-2.5 w-2.5 rounded-full bg-amber-600" />
                <View>
                  <Text className="text-[10px] text-slate-500">Cancelled</Text>
                  <Text className="text-base font-bold text-slate-900">
                    {data?.statusBreakdown.cancelled || 42}
                  </Text>
                </View>
              </View>
            </View>

            {/* Split Progress Bar */}
            <View className="mt-3.5 h-2 w-full flex-row overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full bg-blue-950"
                style={{ width: `${data?.statusBreakdown.confirmedPct || 87}%` }}
              />
              <View
                className="h-full bg-blue-200"
                style={{ width: `${data?.statusBreakdown.cancelledPct || 13}%` }}
              />
            </View>

            <View className="mt-2 flex-row justify-between">
              <Text className="text-[10px] text-slate-600">
                • {data?.statusBreakdown.confirmedPct || 87}% Confirmed
              </Text>
              <Text className="text-[10px] text-slate-600">
                • {data?.statusBreakdown.cancelledPct || 13}% Cancelled
              </Text>
            </View>
          </View>

          {/* Card 3: Reservation Trend Chart */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  RESERVATION TREND
                </Text>
                <Text className="mt-0.5 text-xs font-bold text-slate-900">
                  Weekly distribution (Sept 1–28)
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="h-2 w-2 rounded-sm bg-blue-950 mr-1" />
                <Text className="text-[9px] text-slate-500 mr-2">Conf.</Text>
                <View className="h-2 w-2 rounded-sm bg-blue-200 mr-1" />
                <Text className="text-[9px] text-slate-500">Canc.</Text>
              </View>
            </View>

            {/* 4 Weekly Multi-Bars */}
            <View className="mt-6 flex-row items-end justify-between px-3">
              {data?.weeklyDistribution.map((item) => (
                <View key={item.week} className="items-center flex-1">
                  <View className="flex-row items-end space-x-1">
                    <View
                      className="w-4 rounded-t-sm bg-blue-950"
                      style={{ height: item.confHeight * 0.7 }}
                    />
                    <View
                      className="w-2.5 rounded-t-sm bg-blue-200"
                      style={{ height: item.cancHeight * 0.7 }}
                    />
                  </View>
                  <Text className="mt-2 text-[10px] text-slate-500 font-medium">
                    {item.week}
                  </Text>
                </View>
              ))}
            </View>

            {/* Peak and Daily Avg Banner */}
            <View className="mt-4 flex-row items-center justify-between rounded-xl bg-blue-50/70 p-2.5">
              <View className="flex-row items-center">
                <Ionicons name="pulse" size={14} color="#1E3A8A" />
                <Text className="ml-1.5 text-[10px] font-bold text-blue-950">
                  {data?.weeklyHighlights.peak || 'Peak: Week 3 (96 total)'}
                </Text>
              </View>
              <Text className="text-[10px] font-semibold text-slate-600">
                {data?.weeklyHighlights.dailyAvg || '24.2 / day avg'}
              </Text>
            </View>
          </View>

          {/* Cards 4 & 5: Lead Time & Peak Days */}
          <View className="mt-3 flex-row space-x-3">
            <View className="flex-1 rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={13} color="#64748B" />
                <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  LEAD TIME
                </Text>
              </View>
              <Text className="mt-2 text-xl font-bold text-blue-950">
                {data?.leadTime.value || '4.2 hrs'}
              </Text>
              <Text className="mt-0.5 text-[9px] text-slate-500">
                {data?.leadTime.label || 'Average reservation advance'}
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 ml-2">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={13} color="#64748B" />
                <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  PEAK DAYS
                </Text>
              </View>
              <Text className="mt-2 text-xl font-bold text-blue-950">
                {data?.peakDays.value || 'Mon – Wed'}
              </Text>
              <Text className="mt-0.5 text-[9px] text-slate-500">
                {data?.peakDays.label || '62% of weekly check-ins'}
              </Text>
            </View>
          </View>

          {/* View Details Button */}
          <Pressable
            onPress={() => router.push('/management/reports')}
            className="mt-4 flex-row items-center justify-between rounded-2xl bg-blue-950 px-5 py-3.5 shadow-sm active:opacity-90"
          >
            <View className="flex-row items-center">
              <Ionicons name="list" size={16} color="#FFFFFF" />
              <Text className="ml-2 text-xs font-bold text-white">
                View details
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Reusable Bottom Bar */}
      <ManagementBottomBar currentTab="reservations" />
    </View>
  );
}
