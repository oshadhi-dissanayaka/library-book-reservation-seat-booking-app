import React from 'react';
import { router } from 'expo-router';

import { StaffRootNavigator } from '../../../member 3/screens/StaffRootNavigator';

export default function StaffEntryRoute() {
  return (
    <StaffRootNavigator
      initialLoggedIn={false}
      onBackToPortal={() => {
        router.replace('/portal');
      }}
    />
  );
}
