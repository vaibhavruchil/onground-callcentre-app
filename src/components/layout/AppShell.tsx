import React, { useState } from 'react';
import {
  LayoutDashboard,
  PhoneOutgoing,
  PhoneIncoming,
  History,
  Calendar as CalendarIcon,
  Sparkles,
  PhoneCall,
  Menu,
  X,
  Headphones,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useCallingStore } from '../../features/calling/useCallingStore.ts';
import { Button } from '../ui/button.tsx';
import { CallingDock, CallingSettingsModal } from '../../features/calling/CallingDock.tsx';
import type { AppScreen } from '../../types/index.ts';
import { formatCallDuration } from '../../lib/formatters.ts';

interface NavItem {
  id: AppScreen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  isPulse?: boolean;
}

const SCREEN_META: Record<
  AppScreen,
  { title: string; subtitle: string; isPulse?: boolean }
> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Floor operations overview, priority tasks, and 7-day conversion telemetry',
  },
  'calls-to-make': {
    title: 'Calls to Make',
    subtitle: 'Ranked outbound lead queue ordered by composite ICP and real-time buying intent',
  },
  'incoming-calls': {
    title: 'Incoming Calls',
    subtitle: 'Missed calls, queued callbacks, and SLA-prioritized revenue recovery',
  },
  'recent-calls': {
    title: 'Recent Calls',
    subtitle: 'Session call history, verified WebRTC call logs, and post-call outcome notes',
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Monthly call schedule, discovery slots, and closing reviews',
  },
  'pulse-home': {
    title: 'Pulse Workspace',
    subtitle: 'AvaniBot coordinator, role/task agents, collaboration channels, and floor kudos',
    isPulse: true,
  },
  'pulse-channel': {
    title: 'Pulse Channel',
    subtitle: 'Team collaboration thread and pinned decision cards',
    isPulse: true,
  },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    activeScreen,
    setActiveScreen,
    leads,
    incomingCalls,
    pulseChannels,
  } = useAppStore();

  const {
    callState,
    connectedDurationSeconds,
    startPracticeCall,
  } = useCallingStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [callingModalOpen, setCallingModalOpen] = useState(false);

  const totalUnreadPulse = pulseChannels.reduce((acc, c) => acc + c.unreadCount, 0);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'calls-to-make',
      label: 'Calls to Make',
      icon: PhoneOutgoing,
      count: leads.length,
    },
    {
      id: 'incoming-calls',
      label: 'Incoming Calls',
      icon: PhoneIncoming,
      count: incomingCalls.length,
    },
    {
      id: 'recent-calls',
      label: 'Recent Calls',
      icon: History,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarIcon,
    },
    {
      id: 'pulse-home',
      label: 'Pulse',
      icon: Sparkles,
      count: totalUnreadPulse > 0 ? totalUnreadPulse : undefined,
      isPulse: true,
    },
  ];

  const isPulseActive = activeScreen === 'pulse-home' || activeScreen === 'pulse-channel';
  const currentMeta = SCREEN_META[activeScreen];

  const handleNavigate = (screen: AppScreen) => {
    setActiveScreen(screen);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F6F7F5] text-[#111814]">
      {/* Desktop Left Sidebar — Dark Forest Green */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:shrink-0 bg-[#0D261C] text-[#DCE7E1] border-r border-[#183B2B]"
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-[#193D2D]">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1A4B35] text-white font-mono text-xs font-bold">
              OG
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-white leading-none">
                On-Ground.ai
              </span>
              <span className="block text-[10px] text-[#8EB09F] mt-0.5">
                Call Centre Workstation
              </span>
            </div>
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.id === activeScreen ||
              (item.id === 'pulse-home' && isPulseActive);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  active
                    ? item.isPulse
                      ? 'bg-[#5B21B6] text-white font-semibold'
                      : 'bg-[#194532] text-white font-semibold'
                    : item.isPulse
                    ? 'text-[#D8B4FE] hover:bg-[#3B1A70]/60 hover:text-white'
                    : 'text-[#B5C9BE] hover:bg-[#143527] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active
                        ? 'text-white'
                        : item.isPulse
                        ? 'text-[#C4B5FD]'
                        : 'text-[#87A897]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Rep Workstation Card & Practice Call Action */}
        <div className="border-t border-[#193D2D] p-3 space-y-2.5 bg-[#0A1E16]">
          <div className="flex items-center justify-between text-[11px]">
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">Vaibhav Ruchil</p>
              <p className="truncate text-[#87A897]">Senior Account Executive</p>
            </div>
            <span className="font-mono text-[10px] text-[#6EE7B7]">Desk #04</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => startPracticeCall()}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-[#163C2B] px-2.5 py-1.5 text-[11px] font-medium text-[#D1FAE5] hover:bg-[#1F503A] transition-colors cursor-pointer"
            >
              <Headphones className="h-3 w-3 shrink-0" />
              <span>Practice Call</span>
            </button>
            <button
              type="button"
              onClick={() => setCallingModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-[#163C2B] px-2.5 py-1.5 text-[11px] font-medium text-[#D1FAE5] hover:bg-[#1F503A] transition-colors cursor-pointer"
            >
              <PhoneCall className="h-3 w-3 shrink-0" />
              <span>Dialer Config</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col bg-[#0D261C] text-white">
            <div className="flex h-14 items-center justify-between px-4 border-b border-[#193D2D]">
              <span className="text-sm font-bold text-white">On-Ground.ai</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded p-1 text-[#A7C4B5] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.id === activeScreen ||
                  (item.id === 'pulse-home' && isPulseActive);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium cursor-pointer ${
                      active
                        ? item.isPulse
                          ? 'bg-[#5B21B6] text-white'
                          : 'bg-[#194532] text-white'
                        : 'text-[#B5C9BE] hover:bg-[#143527] hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span className="font-mono text-xs tabular-nums">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header
          className={`flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6 ${
            isPulseActive
              ? 'border-[#DDD6FE] bg-[#F5F3FF]'
              : 'border-[#DCE1DA] bg-white'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D5DBD3] bg-white text-[#111814] lg:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1
                  className={`truncate text-sm font-bold tracking-tight ${
                    isPulseActive ? 'text-[#3B0764]' : 'text-[#111814]'
                  }`}
                >
                  {currentMeta.title}
                </h1>
                <span aria-hidden="true" className="hidden sm:inline text-[#9CA8A1]">
                  ·
                </span>
                <p className="hidden sm:block truncate text-xs text-[#5A6860]">
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {callState === 'Connected' && (
              <button
                type="button"
                onClick={() => setCallingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#112E22] px-3 py-1.5 text-xs font-medium text-[#34D399] cursor-pointer"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums">
                  Live Call {formatCallDuration(connectedDurationSeconds)}
                </span>
              </button>
            )}

            <Button
              variant={isPulseActive ? 'pulse' : 'default'}
              size="sm"
              onClick={() => setCallingModalOpen(true)}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>WebRTC Dialer</span>
            </Button>
          </div>
        </header>

        {/* Integrated Top Call Turret Bar (non-overlapping) */}
        <CallingDock />

        {/* Active Screen Workspace */}
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <div className="mx-auto max-w-[1360px]">{children}</div>
        </main>
      </div>

      <CallingSettingsModal
        open={callingModalOpen}
        onClose={() => setCallingModalOpen(false)}
      />
    </div>
  );
}
