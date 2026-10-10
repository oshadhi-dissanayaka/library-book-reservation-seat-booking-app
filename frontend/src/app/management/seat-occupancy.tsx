import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import { ManagementHeader } from '@/components/management-header';
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
      const response = await fetch(`${API_BASE_URL}/management/seat-occupancy`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();
      setData({
  ...result,
  hourlyDistribution:
    result.hourlyDistribution?.length > 0
      ? result.hourlyDistribution
      : [
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
});
    } catch (_err) {
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
    const timer = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleExportDeskLog = async () => {
  try {
    if (!data) {
      Alert.alert('Export Failed', 'Seat occupancy data is not available.');
      return;
    }

    const roomRows = data.rooms
      ?.map(
        (room) => `
          <tr>
            <td>${room.name}</td>
            <td>${room.type}</td>
            <td>${room.utilized} / ${room.total}</td>
            <td>${room.occupancy}%</td>
            <td>${room.remaining}</td>
          </tr>
        `
      )
      .join('');

    const hourlyRows = data.hourlyDistribution
      ?.map(
        (item) => `
          <tr>
            <td>${item.hour}:00</td>
            <td>${item.pct}%</td>
            <td>${item.peak ? 'Peak Period' : 'Normal'}</td>
          </tr>
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
              padding: 30px;
              color: #0f172a;
            }

            h1 {
              color: #172554;
              margin-bottom: 5px;
            }

            h2 {
              color: #1e3a8a;
              margin-top: 30px;
            }

            .subtitle {
              color: #64748b;
              margin-bottom: 25px;
            }

            .summary {
              background: #eff6ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #1e3a8a;
              color: white;
            }

            .footer {
              margin-top: 35px;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>

        <body>
          <h1>Monthly Desk Log Report</h1>
          <div class="subtitle">
            University Library Management • ${data.period || 'September 2026'}
          </div>

          <div class="summary">
            <strong>Overall Occupancy:</strong> ${data.overallOccupancy}%<br>
            <strong>Total Study Stations:</strong> ${data.totalCatalogedDesks || 50}<br>
            <strong>Average In Use:</strong> ${data.averageInUse || 39}<br>
            <strong>Peak Period:</strong> ${data.peakUtilization?.period || '11:00 AM – 03:00 PM'}<br>
            <strong>Peak Utilization:</strong> ${data.peakUtilization?.peakCap || '92%'}
          </div>

          <h2>Room Allocation Breakdown</h2>

          <table>
            <tr>
              <th>Reading Room</th>
              <th>Type</th>
              <th>Desks Utilized</th>
              <th>Occupancy</th>
              <th>Remaining</th>
            </tr>
            ${roomRows}
          </table>

          <h2>Hourly Occupancy Distribution</h2>

          <table>
            <tr>
              <th>Time</th>
              <th>Occupancy</th>
              <th>Status</th>
            </tr>
            ${hourlyRows}
          </table>

          <div class="footer">
            Generated by University Library Management System.
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    const sharingAvailable = await Sharing.isAvailableAsync();

    if (sharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Monthly Desk Log Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Generated', `PDF created at: ${uri}`);
    }
  } catch (error) {
    console.error('PDF export error:', error);
    Alert.alert('Export Failed', 'Unable to generate the PDF report.');
  }
};

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
        subtitle="Study Space Utilization"
        showBackButton={true}
        badgeLabel="SEATS"
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
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                LIBRARY MANAGEMENT • STUDY SPACE UTILIZATION
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-900">
                Seat Occupancy
              </Text>
            </View>

            <View className="flex-row items-center rounded-xl bg-blue-50 px-3 py-1.5 border border-blue-200">
              <Ionicons name="calendar-outline" size={13} color="#1E3A8A" />
              <Text className="ml-1.5 text-xs font-bold text-blue-950">
                September 2026
              </Text>
              <Ionicons name="chevron-down" size={13} color="#1E3A8A" style={{ marginLeft: 3 }} />
            </View>
          </View>

          {/* Reading Room Hub Card with thumbnail */}
          <View className="mt-3.5 flex-row items-center rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80',
              }}
              className="h-14 w-14 rounded-xl"
            />
            <View className="ml-3 flex-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-blue-800">
                {data?.campusHub || 'CAMPUS CENTRAL HUB'}
              </Text>
              <Text className="text-sm font-bold text-slate-900 mt-0.5">
                {data?.hallName || 'Main Reading Rooms (A & B)'}
              </Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                {data?.totalCatalogedDesks || 50} total cataloged study stations
              </Text>
            </View>
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
              <Ionicons name="business-outline" size={17} color="#1E3A8A" />
            </View>
          </View>

          {/* Card: Overall Occupancy */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2.5 w-2.5 rounded-full bg-blue-950" />
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  OVERALL OCCUPANCY
                </Text>
              </View>
              <View className="rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200">
                <Text className="text-xs font-bold text-blue-950">
                  {data?.statusLabel || 'Steady Usage'}
                </Text>
              </View>
            </View>

            <View className="mt-2.5 flex-row items-baseline">
              <Text className="text-3xl font-black tracking-tight text-blue-950">
                {data?.overallOccupancy || 78}%
              </Text>
              <Text className="ml-2 text-xs font-medium text-slate-500">
                Average daily reading room occupancy
              </Text>
            </View>

            <View className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-blue-50">
              <View
                className="h-full rounded-full bg-blue-950"
                style={{ width: `${data?.overallOccupancy || 78}%` }}
              />
            </View>

            <View className="mt-2 flex-row justify-between">
              <Text className="text-xs font-medium text-slate-500">
                Capacity benchmark: {data?.capacityBenchmark || 50} desks
              </Text>
              <Text className="text-xs font-bold text-slate-700">
                {data?.averageInUse || 39} average in use
              </Text>
            </View>
          </View>

          {/* Section: Room Allocation Breakdown */}
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ROOM ALLOCATION BREAKDOWN
            </Text>
            <Text className="text-xs font-bold text-blue-900">
              2 Active Halls
            </Text>
          </View>

          {/* Room Cards */}
          {data?.rooms?.map((room) => (
            <View
              key={room.id}
              className="mt-2.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-sm font-bold text-slate-900">
                    {room.name}
                  </Text>
                  <View className="ml-2 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200">
                    <Text className="text-xs font-bold text-blue-800">
                      {room.type}
                    </Text>
                  </View>
                </View>
                <Text className="text-lg font-black text-blue-950">
                  {room.occupancy}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center mt-0.5">
                <Text className="text-xs text-slate-500 font-medium">{room.wing}</Text>
                <Text className="text-xs text-slate-400">occupied</Text>
              </View>

              <View className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${room.occupancy}%`,
                    backgroundColor: '#2563EB',
                  }}
                />
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="desktop-outline" size={14} color="#64748B" />
                  <Text className="ml-1.5 text-xs text-slate-700 font-medium">
                    {room.utilized} of {room.total} desks utilized
                  </Text>
                </View>
                <Text className="text-xs font-bold text-emerald-800">
                  {room.remaining} remaining
                </Text>
              </View>
            </View>
          ))}

          {/* Card: Hourly Occupancy Trend */}
          <View className="mt-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  OCCUPANCY TREND
                </Text>
                <Text className="mt-0.5 text-sm font-bold text-slate-900">
                  Hourly Distribution (08:00 – 20:00)
                </Text>
              </View>
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <Ionicons name="pulse" size={16} color="#1E3A8A" />
              </View>
            </View>

            {/* Dense 13 Hour Bars with Vibrant High-Contrast Visuals */}
            <View
  className="mt-6 flex-row items-end justify-between px-1"
  style={{ height: 120 }}
>
             {data?.hourlyDistribution?.map((item) => (
                <View key={item.hour} className="items-center flex-1">
                  {item.peak && (
                     <Text className="mb-0.5 text-[9px] font-black text-blue-950">
                      {item.pct}%
                    </Text>
                  )}
                  <View
                    className="w-3.5 rounded-t-sm shadow-sm"
                    style={{
                      height: Math.max(10, item.pct * 0.75),
                      backgroundColor: item.peak ? '#2563EB' : '#93C5FD',
                    }}
                  />
                  <Text className={`mt-1.5 text-[10px] ${item.peak ? 'font-bold text-blue-950' : 'text-slate-500 font-medium'}`}>
                    {item.hour}
                  </Text>
                </View>
              ))}
            </View>

            {/* Maximum Utilization Highlight */}
            <View className="mt-5 flex-row items-center justify-between rounded-xl bg-blue-50/80 p-3.5 border border-blue-100">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-950 mr-2.5">
                  <Ionicons name="time" size={17} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    MAXIMUM UTILIZATION
                  </Text>
                  <Text className="text-sm font-bold text-slate-900 mt-0.5">
                   Peak Period: {data?.peakUtilization?.period || '11:00 AM – 03:00 PM'}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-black text-blue-950">
                  {data?.peakUtilization?.peakCap || '92%'}
                </Text>
                <Text className="text-xs font-medium text-slate-500">Peak Cap</Text>
              </View>
            </View>

            {/* Monthly Desk Log Report Action Banner */}
            <View className="mt-3.5 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
                <View className="ml-2.5 flex-1">
                  <Text className="text-sm font-bold text-slate-900">
                    Monthly Desk Log Report
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    Generated automatically for Senate Library Board
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleExportDeskLog}
                className="flex-row items-center rounded-xl bg-blue-950 px-3.5 py-2 active:opacity-90"
              >
                <Text className="text-xs font-bold text-white mr-1.5">Export</Text>
                <Ionicons name="download-outline" size={14} color="#FFFFFF" />
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
