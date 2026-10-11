import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { clearAuthSession } from '@/lib/auth-session';

interface ManagementHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  badgeLabel?: string;
}

export function ManagementHeader({
  title = 'Management',
  subtitle = 'Library Reports & Analytics',
  showBackButton = false,
  onBackPress,
  iconName = 'business',
  badgeLabel = 'PORTAL',
}: ManagementHeaderProps) {
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const handleSignOut = async () => {
    setProfileModalVisible(false);
    await clearAuthSession();
    router.replace('/portal');
  };

  return (
    <>
      <StatusBar style="light" />

      {/* Main Top Header Bar */}
      <View className="bg-blue-950 px-5 pb-3.5 pt-14 border-b border-blue-900 shadow-md">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            {showBackButton ? (
              <Pressable
                onPress={onBackPress || (() => router.back())}
                className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-900/90 border border-blue-800 active:bg-blue-800"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-900 border border-blue-700/80 shadow-sm">
                <Ionicons name={iconName} size={21} color="#60A5FA" />
              </View>
            )}

            <View className="ml-2.5 flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-black text-white leading-tight">
                  {title}
                </Text>
                {badgeLabel ? (
                  <View className="ml-2 rounded-full bg-blue-900/90 px-2 py-0.5 border border-blue-700/70">
                    <Text className="text-[9px] font-bold tracking-wider text-blue-200">
                      {badgeLabel}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="flex-row items-center mt-0.5">
                <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                <Text className="text-xs font-semibold text-blue-200/90" numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Profile Avatar with Amber Gold Border & Online Status */}
          <Pressable
            onPress={() => setProfileModalVisible(true)}
            className="relative active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Management Profile Information"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-900 border-2 border-amber-400 shadow-sm">
              <Ionicons name="person" size={17} color="#FFFFFF" />
            </View>
            <View className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-blue-950 items-center justify-center">
              <View className="h-1.5 w-1.5 rounded-full bg-white" />
            </View>
          </Pressable>
        </View>

        {/* Decorative Slim Accent Line (Amber Gold / Sky Blue hairline) */}
        <View className="mt-3 h-[2px] w-full rounded-full bg-gradient-to-r from-blue-700 via-amber-400/80 to-blue-700 bg-blue-800" />
      </View>

      {/* Interactive Management Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <Pressable
          onPress={() => setProfileModalVisible(false)}
          className="flex-1 justify-center bg-black/55 px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
          >
            {/* Header / Crest */}
            <View className="items-center pb-4 border-b border-slate-100">
              <View className="relative mb-3">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-950 shadow-md border-2 border-amber-400">
                  <Ionicons name="person" size={28} color="#FFFFFF" />
                </View>
                <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              </View>

              <Text className="text-base font-black text-slate-900 text-center">
                Lasanthi DMO (Member 4)
              </Text>
              <Text className="text-xs font-semibold text-blue-900 mt-0.5">
                University Management & Reporting
              </Text>
              <View className="mt-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-200">
                <Text className="text-[10px] font-bold text-blue-950">
                  ID: MGT001 • IT23848634
                </Text>
              </View>
            </View>

            {/* Scope Indices */}
            <View className="mt-4 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2">
              <View className="flex-row items-center justify-between py-1 border-b border-slate-200/60">
                <Text className="text-xs font-semibold text-slate-500">Institution</Text>
                <Text className="text-xs font-bold text-slate-800">SLIIT Central Library</Text>
              </View>
              <View className="flex-row items-center justify-between py-1 border-b border-slate-200/60">
                <Text className="text-xs font-semibold text-slate-500">Scope</Text>
                <Text className="text-xs font-bold text-emerald-800">Executive Overview & Analytics</Text>
              </View>
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs font-semibold text-slate-500">Security Clearance</Text>
                <Text className="text-xs font-bold text-blue-900">Level 4 Audit Sign-off</Text>
              </View>
            </View>

            {/* Actions */}
            <View className="mt-5 space-y-2.5">
              <Pressable
                onPress={handleSignOut}
                className="flex-row items-center justify-center rounded-2xl bg-red-50 py-3.5 border border-red-200 active:opacity-80"
              >
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                <Text className="ml-2 text-xs font-bold text-red-700">
                  Sign Out to Portal Gateways
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setProfileModalVisible(false)}
                className="items-center justify-center rounded-2xl bg-slate-100 py-3.5 active:opacity-80"
              >
                <Text className="text-xs font-bold text-slate-700">Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
