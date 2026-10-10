import { router } from 'expo-router';
import { useEffect } from 'react';

import AppTabs from '@/components/app-tabs';
import { loadAuthSession } from '@/lib/auth-session';

export const unstable_settings = { initialRouteName: 'home' };

/**
 * Student / Academic Staff tab group guard: the tabs (Home, Books, Seats,
 * Reservations, Notifications) require a signed-in student or academic-staff
 * session. Anyone else is returned to the portal gateway.
 */
export default function TabLayout() {
  useEffect(() => {
    let mounted = true;
    void loadAuthSession().then((session) => {
      if (!mounted) return;
      if (
        !session ||
        (session.user.role !== 'student' && session.user.role !== 'academic_staff')
      ) {
        router.replace('/portal');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return <AppTabs />;
}
