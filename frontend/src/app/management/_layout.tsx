import { Stack, router } from 'expo-router';
import { useEffect } from 'react';

import { loadAuthSession } from '@/lib/auth-session';

/**
 * Management group guard: every /management/* route requires a signed-in
 * management session. Without one the user is sent to the management login
 * (the group's index route) instead of seeing executive dashboards.
 */
export default function ManagementLayout() {
  useEffect(() => {
    let mounted = true;
    void loadAuthSession().then((session) => {
      if (!mounted) return;
      if (!session || session.user.role !== 'management') {
        router.replace('/management');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
