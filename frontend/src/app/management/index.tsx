import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { signIn } from '@/lib/auth-api';
import { loadAuthSession } from '@/lib/auth-session';

export default function ManagementLoginScreen() {
  const [institutionalId, setInstitutionalId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already signed in as management -> skip the login form.
  useEffect(() => {
    let mounted = true;
    void loadAuthSession().then((session) => {
      if (mounted && session?.user.role === 'management') {
        router.replace('/management/library-overview');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!institutionalId.trim() || !password) {
      setError('Please enter your Management ID and Password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Real backend validation: correct ID + password + role "management".
      await signIn({
        institutionalId: institutionalId.trim(),
        password,
        role: 'management',
      });
      router.replace('/management/library-overview');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
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
          <Pressable onPress={() => router.replace('/portal')} accessibilityRole="button" accessibilityLabel="Back to Role Selection" className="px-6 pt-6">
            <Text className="text-sm font-semibold text-blue-950">Back to Role Selection</Text>
          </Pressable>
          {/* Top Header Section */}
          <View className="px-6 pt-12">
            <Pressable
              onPress={() => router.replace('/(tabs)' as any)}
              className="flex-row items-center mb-2 active:opacity-70 self-start"
            >
              <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
              <Text className="ml-1 text-sm font-semibold text-blue-900">Portal Home</Text>
            </Pressable>
          </View>
          <View className="items-center px-6 pt-2">
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
            {/* Management ID */}
            <View className="mb-4">
              <View className="flex-row justify-between">
                <Text className="mb-1.5 text-xs font-semibold text-slate-800">
                  Management ID
                </Text>
                <Text className="text-xs font-medium text-blue-800">Required</Text>
              </View>
              <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                <Ionicons name="id-card-outline" size={18} color="#64748B" />
                <TextInput
                  value={institutionalId}
                  onChangeText={(value) => {
                    setInstitutionalId(value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. MGT001"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
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
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) setError('');
                  }}
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

            {/* Sign-in error */}
            {error ? (
              <View className="mb-3 flex-row items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                <Text className="ml-2 flex-1 text-xs font-medium text-red-700">{error}</Text>
              </View>
            ) : null}

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
                Use your central university library management credentials to proceed to daily analytics and occupancy metrics. Management accounts are issued by the University - there is no public sign-up for this portal.
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

    </View>
  );
}
