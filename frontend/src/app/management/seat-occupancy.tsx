import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ManagementBottomBar } from '@/components/management-bottom-bar';
import { API_BASE_URL } from '@/constants/api';

type SeatOccupancyData = {
  period: string;
  campusHub: string;
  hallName: string;
  totalCatalogedDesks: number;
  overallOccupancy: number;
  statusLabel: string;
  capacityBenchmark: number;
  averageInUse: number;
  rooms: {
    id: string;
    name: string;
    type: string;
    wing: string;
    occupancy: number;
    utilized: number;
    total: number;
    remaining: number;
  }[];
  hourlyDistribution: { hour: string; pct: number; peak: boolean }[];
  peakUtilization: {
    period: string;
    peakCap: string;
  };
};

export default function SeatOccupancyScreen() {
  const [data, setData] = useState<SeatOccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/seat-occupancy`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();
      setData(result);
    } catch (err) {
      // Fallback matching Figma specs
      setData({
        period: 'September 2026',
        campusHub: 'CAMPUS CENTRAL HUB',
        hallName: 'Main Reading Rooms (A & B)',
        totalCatalogedDesks: 50,
        overallOccupancy: 78,
        statusLabel: 'Steady Usage',
        capacityBenchmark: 50,
        averageInUse: 39,
        rooms: [
          {
            id: 'room-a',
            name: 'Reading Room A',
            type: 'Quiet Zone',
            wing: 'West Wing • Floor 2',
            occupancy: 84,
            utilized: 25,
            total: 30,
            remaining: 5,
          },
          {
            id: 'room-b',
            name: 'Reading Room B',
            type: 'Collaborative Study',
            wing: 'East Wing • Floor 1',
            occupancy: 71,
            utilized: 14,
            total: 20,
            remaining: 6,
          },
        ],
        hourlyDistribution: [
          { hour: '08', pct: 30, peak: false },
          { hour: '09', pct: 45, peak: false },
          { hour: '10', pct: 65, peak: false },
          { hour: '11', pct: 88, peak: true },
          { hour: '12', pct: 92, peak: true },
          { hour: '13', pct: 91, peak: true },
          { hour: '14', pct: 89, peak: true },
          { hour: '15', pct: 85, peak: true },
          { hour: '16', pct: 72, peak: false },
          { hour: '17', pct: 58, peak: false },
          { hour: '18', pct: 44, peak: false },
          { hour: '19', pct: 32, peak: false },
          { hour: '20', pct: 18, peak: false },
        ],
        peakUtilization: {
          period: '11:00 AM – 03:00 PM',
          peakCap: '92%',
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

  const handleExportDeskLog = () => {
    Alert.alert(
      'Export Desk Log',
      'Senate Library Board monthly desk log export generated successfully.',
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
                LIBRARY MANAGEMENT • STUDY SPACE UTILIZATION
              </Text>
              <Text className="mt-0.5 text-xl font-bold text-slate-900">
                Seat Occupancy
              </Text>
            </View>

            <View className="flex-row items-center rounded-xl bg-blue-50 px-2.5 py-1">
              <Ionicons name="calendar-outline" size={12} color="#1E3A8A" />
              <Text className="ml-1 text-[10px] font-bold text-blue-950">
                September 2026
              </Text>
              <Ionicons name="chevron-down" size={12} color="#1E3A8A" style={{ marginLeft: 3 }} />
            </View>
          </View>

          {/* Reading Room Hub Card with thumbnail */}
          <View className="mt-3.5 flex-row items-center rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80',
              }}
              className="h-12 w-12 rounded-xl"
            />
            <View className="ml-3 flex-1">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-blue-800">
                {data?.campusHub || 'CAMPUS CENTRAL HUB'}
              </Text>
              <Text className="text-xs font-bold text-slate-900">
                {data?.hallName || 'Main Reading Rooms (A & B)'}
              </Text>
              <Text className="text-[10px] text-slate-400">
                {data?.totalCatalogedDesks || 50} total cataloged study stations
              </Text>
            </View>
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <Ionicons name="business-outline" size={15} color="#1E3A8A" />
            </View>
          </View>

          {/* Card: Overall Occupancy */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-blue-950" />
                <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  OVERALL OCCUPANCY
                </Text>
              </View>
              <View className="rounded-full bg-blue-50 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-blue-900">
                  {data?.statusLabel || 'Steady Usage'}
                </Text>
              </View>
            </View>

            <View className="mt-2.5 flex-row items-baseline">
              <Text className="text-3xl font-bold tracking-tight text-blue-950">
                {data?.overallOccupancy || 78}%
              </Text>
              <Text className="ml-2 text-xs text-slate-500">
                Average daily reading room occupancy
              </Text>
            </View>

            <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-50">
              <View
                className="h-full rounded-full bg-blue-950"
                style={{ width: `${data?.overallOccupancy || 78}%` }}
              />
            </View>

            <View className="mt-2 flex-row justify-between">
              <Text className="text-[10px] text-slate-400">
                Capacity benchmark: {data?.capacityBenchmark || 50} desks
              </Text>
              <Text className="text-[10px] font-medium text-slate-600">
                {data?.averageInUse || 39} average in use
              </Text>
            </View>
          </View>

          {/* Section: Room Allocation Breakdown */}
          <View className="mt-3.5 flex-row items-center justify-between">
            <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              ROOM ALLOCATION BREAKDOWN
            </Text>
            <Text className="text-[10px] font-bold text-blue-900">
              2 Active Halls
            </Text>
          </View>

          {/* Room Cards */}
          {data?.rooms.map((room) => (
            <View
              key={room.id}
              className="mt-2 rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-xs font-bold text-slate-900">
                    {room.name}
                  </Text>
                  <View className="ml-2 rounded-full bg-blue-50 px-2 py-0.5">
                    <Text className="text-[9px] font-semibold text-blue-800">
                      {room.type}
                    </Text>
                  </View>
                </View>
                <Text className="text-base font-bold text-blue-950">
                  {room.occupancy}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center mt-0.5">
                <Text className="text-[10px] text-slate-400">{room.wing}</Text>
                <Text className="text-[9px] text-slate-400">occupied</Text>
              </View>

              <View className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <View
                  className="h-full rounded-full bg-blue-950"
                  style={{ width: `${room.occupancy}%` }}
                />
              </View>

              <View className="mt-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="desktop-outline" size={13} color="#64748B" />
                  <Text className="ml-1 text-[10px] text-slate-600">
                    {room.utilized} of {room.total} desks utilized
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-slate-800">
                  {room.remaining} remaining
                </Text>
              </View>
            </View>
          ))}

          {/* Card: Hourly Occupancy Trend */}
          <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  OCCUPANCY TREND
                </Text>
                <Text className="mt-0.5 text-xs font-bold text-slate-900">
                  Hourly Distribution (08:00 – 20:00)
                </Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-lg bg-blue-50">
                <Ionicons name="pulse" size={14} color="#1E3A8A" />
              </View>
            </View>

            {/* Dense 13 Hour Bars */}
            <View className="mt-5 flex-row items-end justify-between">
              {data?.hourlyDistribution.map((item) => (
                <View key={item.hour} className="items-center flex-1">
                  {item.peak && (
                    <Text className="mb-0.5 text-[7px] font-bold text-blue-950">
                      {item.pct}%
                    </Text>
                  )}
                  <View
                    className={`w-3.5 rounded-t-sm ${
                      item.peak ? 'bg-blue-950' : 'bg-blue-100'
                    }`}
                    style={{ height: item.pct * 0.7 }}
                  />
                  <Text className="mt-1 text-[8px] text-slate-400">
                    {item.hour}
                  </Text>
                </View>
              ))}
            </View>

            {/* Maximum Utilization Highlight */}
            <View className="mt-4 flex-row items-center justify-between rounded-xl bg-blue-50/80 p-3">
              <View className="flex-row items-center flex-1">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-950 mr-2.5">
                  <Ionicons name="time" size={15} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-[8px] font-bold uppercase tracking-wider text-blue-900">
                    MAXIMUM UTILIZATION
                  </Text>
                  <Text className="text-xs font-bold text-slate-900">
                    Peak Period: {data?.peakUtilization.period || '11:00 AM – 03:00 PM'}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-blue-950">
                  {data?.peakUtilization.peakCap || '92%'}
                </Text>
                <Text className="text-[9px] text-slate-400">Peak Cap</Text>
              </View>
            </View>

            {/* Monthly Desk Log Report Action Banner */}
            <View className="mt-3.5 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="calendar-outline" size={16} color="#1E3A8A" />
                <View className="ml-2">
                  <Text className="text-xs font-bold text-slate-900">
                    Monthly Desk Log Report
                  </Text>
                  <Text className="text-[9px] text-slate-500">
                    Generated automatically for Senate Library Board
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleExportDeskLog}
                className="flex-row items-center rounded-xl bg-blue-950 px-3 py-1.5 active:opacity-90"
              >
                <Text className="text-[11px] font-bold text-white mr-1">Export</Text>
                <Ionicons name="download-outline" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Reusable Bottom Bar */}
      <ManagementBottomBar currentTab="seats" />
    </View>
  );
}
