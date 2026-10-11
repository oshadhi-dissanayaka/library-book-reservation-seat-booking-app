import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { M2Colors, M2Shadow } from '@/components/m2';
import { AuthUser, getCurrentUser, loadAuthSession } from '@/lib/auth-session';
import { clearPortalSession } from '@/lib/portal-session';

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  student: 'Student',
  academic_staff: 'Academic Staff',
  library_staff: 'Library Staff',
  management: 'University Management',
};

export default function ProfileScreen() {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadAuthSession().then((session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, []));

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await clearPortalSession();
    setUser(null);
    router.replace('/portal');
    setSigningOut(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator color={M2Colors.blue} accessibilityLabel="Loading profile" /> : user ? (
        <>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} tintColor={M2Colors.blue} size={48} />
            </View>
            <Text style={styles.name}>{user.name || user.institutionalId}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{ROLE_LABELS[user.role]}</Text></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">Account details</Text>
            {[
              ['Full name', user.name],
              ['Institutional ID', user.institutionalId],
              ['Email address', user.email],
              ['Account type', ROLE_LABELS[user.role]],
            ].map(([label, value]) => (
              <View key={label} style={styles.detail}>
                <Text style={styles.label}>{label}</Text>
                <Text selectable style={styles.value}>{value || 'Not available'}</Text>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign out" disabled={signingOut} onPress={() => void signOut()} style={[styles.button, signingOut && styles.disabled]}>
            {signingOut && <ActivityIndicator color="#FFFFFF" />}
            <Text style={styles.buttonText}>{signingOut ? 'Signing out...' : 'Sign out'}</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>You are signed out</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/portal')} style={styles.button}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: M2Colors.canvas },
  content: { padding: 20, paddingBottom: 48, gap: 20, width: '100%', maxWidth: 720, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: M2Colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: M2Colors.ink, textAlign: 'center' },
  badge: { backgroundColor: M2Colors.paleBlue, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  badgeText: { color: M2Colors.blue, fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: M2Colors.cardBg, borderRadius: 20, padding: 20, gap: 16, ...M2Shadow },
  cardTitle: { color: M2Colors.ink, fontSize: 17, fontWeight: '800' },
  detail: { gap: 6, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: M2Colors.border },
  label: { fontSize: 13, color: M2Colors.muted },
  value: { fontSize: 16, fontWeight: '600', color: M2Colors.ink },
  button: { minHeight: 54, borderRadius: 14, backgroundColor: M2Colors.blue, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, padding: 14 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
