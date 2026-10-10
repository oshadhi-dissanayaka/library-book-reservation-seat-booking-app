import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { StaffBottomTabs, StaffTabName } from '../components/StaffBottomTabs';
import { staffTheme } from '../theme/staffTheme';
import { Reservation, StaffUser } from '../types/staff.types';
import { BookAvailabilityManagementScreen } from './BookAvailabilityManagementScreen';
import { NoShowCancellationScreen } from './NoShowCancellationScreen';
import { ReadingRoomOccupancyScreen } from './ReadingRoomOccupancyScreen';
import { RejectCancelReservationScreen } from './RejectCancelReservationScreen';
import { StaffDashboardScreen } from './StaffDashboardScreen';
import { StaffLoginScreen } from './StaffLoginScreen';
import { StaffReservationDetailsScreen } from './StaffReservationDetailsScreen';
import { StaffReservationManagementScreen } from './StaffReservationManagementScreen';

type ScreenView =
  | 'login'
  | 'dashboard'
  | 'reservations'
  | 'details'
  | 'reject'
  | 'books'
  | 'room'
  | 'noshows';

interface StaffRootNavigatorProps {
  onBackToPortal?: () => void;
  initialLoggedIn?: boolean;
}

export const StaffRootNavigator: React.FC<StaffRootNavigatorProps> = ({
  onBackToPortal,
  initialLoggedIn = true,
}) => {
  const [currentView, setCurrentView] = useState<ScreenView>(
    initialLoggedIn ? 'dashboard' : 'login'
  );
  const [currentUser, setCurrentUser] = useState<StaffUser | null>({
    staffId: 'STF-4092',
    name: 'Circulation Desk Officer',
    role: 'Library Staff',
    desk: 'Circulation Desk 01',
    shift: '08:00 - 17:00',
  });
  const [activeTab, setActiveTab] = useState<StaffTabName>('dashboard');
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const staffId = currentUser?.staffId || 'STF-4092';

  const handleLoginSuccess = (user: StaffUser) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    setActiveTab('dashboard');
  };

  const handleSelectTab = (tab: StaffTabName) => {
    setActiveTab(tab);
    setCurrentView(tab as ScreenView);
  };

  const handleOpenReservationDetails = (res: Reservation) => {
    setSelectedReservation(res);
    setCurrentView('details');
  };

  const handleOpenReject = (res: Reservation) => {
    setSelectedReservation(res);
    setCurrentView('reject');
  };

  const isMainTab = ['dashboard', 'reservations', 'books', 'room'].includes(
    currentView
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Staff Login */}
        {currentView === 'login' && (
          <StaffLoginScreen
            onLoginSuccess={handleLoginSuccess}
            onBackToPortal={onBackToPortal}
          />
        )}

        {/* Staff Dashboard */}
        {currentView === 'dashboard' && (
          <StaffDashboardScreen
            staffId={staffId}
            onNavigateReservations={() => handleSelectTab('reservations')}
            onNavigateBooks={() => handleSelectTab('books')}
            onNavigateRoom={() => handleSelectTab('room')}
            onNavigateNoShows={() => setCurrentView('noshows')}
            onSelectReservation={handleOpenReservationDetails}
            onBackToPortal={onBackToPortal}
          />
        )}

        {/* Reservation Management */}
        {currentView === 'reservations' && (
          <StaffReservationManagementScreen
            staffId={staffId}
            onSelectReservation={handleOpenReservationDetails}
          />
        )}

        {/* Reservation Details */}
        {currentView === 'details' && selectedReservation && (
          <StaffReservationDetailsScreen
            reservation={selectedReservation}
            staffId={staffId}
            onBack={() => setCurrentView(activeTab as ScreenView)}
            onNavigateReject={handleOpenReject}
            onStatusUpdated={(updated) => setSelectedReservation(updated)}
          />
        )}

        {/* Reject / Cancel Reservation */}
        {currentView === 'reject' && selectedReservation && (
          <RejectCancelReservationScreen
            reservation={selectedReservation}
            staffId={staffId}
            onBack={() => setCurrentView('details')}
            onRejectionSuccess={() => {
              setCurrentView('reservations');
              setActiveTab('reservations');
            }}
          />
        )}

        {/* Book Availability Management */}
        {currentView === 'books' && (
          <BookAvailabilityManagementScreen staffId={staffId} />
        )}

        {/* Reading Room Occupancy */}
        {currentView === 'room' && (
          <ReadingRoomOccupancyScreen
            staffId={staffId}
            onNavigateNoShows={() => setCurrentView('noshows')}
          />
        )}

        {/* No-show & Cancellation Management */}
        {currentView === 'noshows' && (
          <NoShowCancellationScreen
            staffId={staffId}
            onBack={() => setCurrentView(activeTab as ScreenView)}
          />
        )}

        {/* Bottom Tab Navigation on Main Tabs */}
        {isMainTab && (
          <StaffBottomTabs
            currentTab={activeTab}
            onSelectTab={handleSelectTab}
          />
        )}
      </View>
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
    backgroundColor: staffTheme.canvas,
  },
});
