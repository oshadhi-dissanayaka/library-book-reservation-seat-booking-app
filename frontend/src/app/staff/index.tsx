import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { StaffRootNavigator } from '../../../member 3/screens/StaffRootNavigator';
import { StaffUser } from '../../../member 3/types/staff.types';
import { clearAuthSession, loadAuthSession } from '@/lib/auth-session';

/**
 * Library Staff entry (route "/staff").
 *
 * On launch the stored session decides the starting screen:
 *   - library_staff session -> Staff Dashboard (already signed in)
 *   - anything else         -> Staff Login (no public staff signup)
 */
export default function StaffEntryRoute() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [initialUser, setInitialUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    let mounted = true;
    void loadAuthSession().then((session) => {
      if (!mounted) return;
      const isStaff = session?.user.role === 'library_staff';
      setSignedIn(Boolean(isStaff));
      setInitialUser(
        isStaff && session
          ? {
              staffId: session.user.institutionalId,
              name: session.user.name,
              role: 'Library Staff',
              desk: 'Circulation Desk 01',
              shift: '08:00 - 17:00',
            }
          : null
      );
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#f4f6fb' }}>
      <ActivityIndicator style={{ marginTop: 64 }} color="#102b69" />
    </View>;
  }

  return (
    <StaffRootNavigator
      initialLoggedIn={signedIn}
      initialUser={initialUser}
      onBackToPortal={() => {
        void clearAuthSession().then(() => router.replace('/portal'));
      }}
    />
  );
}
