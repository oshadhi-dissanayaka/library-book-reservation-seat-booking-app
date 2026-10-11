import { SymbolView } from 'expo-symbols';
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

import { saveAuthSession } from '@/lib/auth-session';
import { staffApi } from '../services/staffApi';
import { staffTheme } from '../theme/staffTheme';
import { StaffUser } from '../types/staff.types';

interface StaffLoginScreenProps {
  onLoginSuccess: (user: StaffUser) => void;
  onBackToPortal?: () => void;
}

export const StaffLoginScreen: React.FC<StaffLoginScreenProps> = ({
  onLoginSuccess,
  onBackToPortal,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter your Staff ID');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await staffApi.login(username, password);
      if (result.success) {
        // Persist the real session (JWT + user) so relaunches land on the
        // staff dashboard and protected calls can send the bearer token.
        if (result.data.token) {
          await saveAuthSession({
            token: result.data.token,
            user: {
              institutionalId: result.data.staffId,
              name: result.data.name,
              email: result.data.email ?? '',
              role: 'library_staff',
            },
          });
        }
        onLoginSuccess(result.data);
      } else {
        setError(result.message || 'Authentication failed. Please verify credentials.');
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
              <SymbolView
                name={{
                  ios: 'building.columns',
                  android: 'account_balance',
                  web: 'account_balance',
                }}
                tintColor={staffTheme.white}
                size={30}
              />
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
              <Text style={styles.label}>Library Staff ID</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError('');
                }}
                placeholder="Enter Staff ID (e.g. LIB001)"
                placeholderTextColor={staffTheme.placeholder}
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
                placeholderTextColor={staffTheme.placeholder}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={staffTheme.white} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In to Circulation Terminal →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>No staff self-signup:</Text>
              <Text style={styles.hintCode}>
                Library Staff accounts are issued by University Management.
              </Text>
              <Text style={styles.hintSub}>
                Sign in with the Library Staff ID and temporary password you were issued. You will
                be asked to keep using it with your own password.
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
    backgroundColor: staffTheme.canvas,
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
    backgroundColor: staffTheme.paleBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  backBtnText: {
    color: staffTheme.navy,
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
    backgroundColor: staffTheme.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staffTheme.navyLine,
  },
  portalTag: {
    color: staffTheme.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: staffTheme.ink,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: staffTheme.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: staffTheme.white,
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  errorBox: {
    backgroundColor: staffTheme.paleRed,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: staffTheme.red,
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: staffTheme.ink,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: staffTheme.line,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: staffTheme.ink,
    backgroundColor: staffTheme.white,
  },
  loginButton: {
    backgroundColor: staffTheme.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: staffTheme.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hintBox: {
    backgroundColor: staffTheme.canvas,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: staffTheme.line,
  },
  hintTitle: {
    color: staffTheme.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  hintCode: {
    color: staffTheme.navy,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  hintSub: {
    color: staffTheme.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});
