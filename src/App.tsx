import React, { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell.tsx';
import { DashboardScreen } from './features/dashboard/DashboardScreen.tsx';
import { CallsToMakeScreen } from './features/calls-to-make/CallsToMakeScreen.tsx';
import { IncomingCallsScreen } from './features/incoming-calls/IncomingCallsScreen.tsx';
import { RecentCallsScreen } from './features/recent-calls/RecentCallsScreen.tsx';
import { CalendarScreen } from './features/calendar/CalendarScreen.tsx';
import { PulseHomeScreen } from './features/pulse/PulseHomeScreen.tsx';
import { PulseChannelScreen } from './features/pulse/PulseChannelScreen.tsx';
import { LeadsModal } from './features/leads/LeadsModal.tsx';
import { useAppStore } from './store/useAppStore.ts';
import { useCallingStore } from './features/calling/useCallingStore.ts';

export default function App() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const initSignaling = useCallingStore((s) => s.initSignaling);

  useEffect(() => {
    initSignaling();
  }, [initSignaling]);

  return (
    <AppShell>
      {activeScreen === 'dashboard' && <DashboardScreen />}
      {activeScreen === 'calls-to-make' && <CallsToMakeScreen />}
      {activeScreen === 'incoming-calls' && <IncomingCallsScreen />}
      {activeScreen === 'recent-calls' && <RecentCallsScreen />}
      {activeScreen === 'calendar' && <CalendarScreen />}
      {activeScreen === 'pulse-home' && <PulseHomeScreen />}
      {activeScreen === 'pulse-channel' && <PulseChannelScreen />}

      {/* Reusable Leads Modal accessible from Dashboard tasks, Calls to Make, Incoming Calls, Recent Calls, and Calendar */}
      <LeadsModal />
    </AppShell>
  );
}
