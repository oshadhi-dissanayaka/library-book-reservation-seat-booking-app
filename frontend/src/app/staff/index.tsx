import React from 'react';
import { router } from 'expo-router';

import { StaffRootNavigator } from '../../../member 3/screens/StaffRootNavigator';

export default function StaffEntryRoute() {
  return (
    <StaffRootNavigator
      onBackToPortal={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/' as any);
        }
      }}
    />
  );
}
