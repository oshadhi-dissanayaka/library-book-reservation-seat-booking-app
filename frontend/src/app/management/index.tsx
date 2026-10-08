import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ManagementBottomBar } from '@/components/management-bottom-bar';

export default function ManagementLoginScreen() {
  const [username, setUsername] = useState('MGT-4011');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your Username / Staff ID and Password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/management/library-overview');
    }, 600);
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 90 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Section */}
          <View className="items-center px-6 pt-14">
            {/* Institution Round Icon with small badge */}
            <View className="relative">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="business" size={32} color="#1E3A8A" />
              </View>
              <View className="absolute bottom-0 right-0 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-900">
                <Ionicons name="key" size={10} color="#FFFFFF" />
              </View>
            </View>

            {/* Pill Badge */}
            <View className="mt-4 flex-row items-center rounded-full bg-blue-50 px-4 py-1.5">
              <View className="mr-2 h-2 w-2 rounded-full bg-blue-700" />
              <Text className="text-[10px] font-bold tracking-wider text-blue-900">
                LIBRARY MANAGEMENT • UNIVERSITY ACCESS
              </Text>
            </View>

            {/* Title & Subtitle */}
            <Text className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Management Login
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              Library Reports & Analytics
            </Text>

            {/* Restricted Banner with Library Background Image */}
            <View className="mt-5 w-full overflow-hidden rounded-2xl bg-blue-950 shadow-md">
              <ImageBackground
                source={{
                  uri: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
                }}
                className="w-full px-5 py-6"
                imageStyle={{ opacity: 0.22 }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={18} color="#93C5FD" />
                  <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-white">
                    RESTRICTED EXECUTIVE PORTAL
                  </Text>
                </View>
                <Text className="mt-1 text-[11px] leading-4 text-blue-100">
                  Authorized personnel access for live usage indices & archival governance
                </Text>
              </ImageBackground>
            </View>
          </View>

          {/* Form Section */}
          <View className="px-6 pt-6">
            {/* Username / Staff ID */}
            <View className="mb-4">
              <View className="flex-row justify-between">
                <Text className="mb-1.5 text-xs font-semibold text-slate-800">
                  Username / Staff ID
                </Text>
                <Text className="text-xs font-medium text-blue-800">Required</Text>
              </View>
              <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                <Ionicons name="id-card-outline" size={18} color="#64748B" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. MGT-4011"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  className="ml-3 flex-1 text-sm font-medium text-slate-900"
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-6">
              <View className="flex-row justify-between">
                <Text className="mb-1.5 text-xs font-semibold text-slate-800">
                  Password
                </Text>
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Forgot Password',
                      'Please contact the Central University IT Helpdesk to reset your management credentials.'
                    )
                  }
                >
                  <Text className="text-xs font-medium text-blue-800">
                    Forgot password?
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="ml-3 flex-1 text-sm font-medium text-slate-900"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className="flex-row items-center justify-center rounded-2xl bg-blue-950 py-4 shadow-sm active:opacity-90"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-sm font-bold tracking-wider text-white">
                    LOGIN
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </>
              )}
            </Pressable>

            {/* Information Card */}
            <View className="mt-6 flex-row items-start rounded-2xl bg-blue-50/60 p-4">
              <Ionicons name="school" size={20} color="#1E3A8A" />
              <Text className="ml-3 flex-1 text-[11px] leading-5 text-slate-600">
                Use your central university library management credentials to proceed to daily analytics and occupancy metrics.
              </Text>
            </View>

            {/* SSL Footer Notice */}
            <View className="mt-6 items-center">
              <View className="flex-row items-center">
                <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                <Text className="ml-1 text-[10px] text-slate-500">
                  Strict SSL / TLS 1.3 Encryption
                </Text>
              </View>
              <Text className="mt-0.5 text-[9px] text-slate-400">
                Institutional Library Services Network
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tabs matching design */}
      <ManagementBottomBar currentTab="overview" />
    </View>
  );
}