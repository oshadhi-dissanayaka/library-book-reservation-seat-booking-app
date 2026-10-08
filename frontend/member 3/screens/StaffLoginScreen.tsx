import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { staffApi } from '../services/staffApi';
import { StaffUser } from '../types/staff.types';

interface StaffLoginScreenProps {
  onLoginSuccess: (user: StaffUser) => void;
  onBackToPortal?: () => void;
}

export const StaffLoginScreen: React.FC<StaffLoginScreenProps> = ({
  onLoginSuccess,
  onBackToPortal,
}) => {
  const [username, setUsername] = useState('STF-4092');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter your Staff ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await staffApi.login(username, password);
      if (result.success) {
        onLoginSuccess(result.data);
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } catch {
      setError('Unable to reach server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {onBackToPortal && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBackToPortal}
              activeOpacity={0.7}>
              <Text style={styles.backBtnText}>← Role Selection</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerBox}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🏛️</Text>
            </View>
            <Text style={styles.portalTag}>INSTITUTIONAL ACCESS</Text>
            <Text style={styles.title}>Library Portal Login</Text>
            <Text style={styles.subtitle}>
              Staff Operations & Circulation Desk Access
            </Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Username / Staff ID</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError('');
                }}
                placeholder="Enter Staff ID (e.g. STF-4092)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                placeholder="Enter Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In to Circulation Terminal →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Staff Terminal Credentials:</Text>
              <Text style={styles.hintCode}>ID: STF-4092 | Role: Circulation Desk</Text>
              <Text style={styles.hintSub}>
                Authorized campus library staff credentials required to access circulation queues and resource status.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoIcon: {
    fontSize: 32,
  },
  portalTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  loginButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hintBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hintTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  hintCode: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  hintSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
});
