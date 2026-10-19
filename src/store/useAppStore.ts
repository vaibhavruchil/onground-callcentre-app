import { create } from 'zustand';
import type {
  AppScreen,
  LeadRecord,
  IncomingCallRecord,
  RecentCallRecord,
  CalendarEvent,
  PulseChannel,
  PulseMessage,
  DashboardTask,
} from '../types/index.ts';
import { INITIAL_LEADS } from '../data/leads.ts';
import { INITIAL_INCOMING_CALLS, INITIAL_RECENT_CALLS } from '../data/calls.ts';
import { buildInitialCalendarEvents } from '../data/calendar.ts';
import {
  INITIAL_PULSE_CHANNELS,
  INITIAL_PULSE_MESSAGES,
} from '../data/pulse.ts';
import { INITIAL_DASHBOARD_TASKS } from '../data/dashboard.ts';
import { navigateMonth, toDateString } from '../lib/calendar-utils.ts';

const PULSE_STORAGE_KEY = 'onground_pulse_messages_v1';
const PULSE_PINNED_STORAGE_KEY = 'onground_pulse_pinned_v1';
const RECENT_CALLS_STORAGE_KEY = 'onground_recent_calls_v1';

function loadPersistedMessages(): Record<string, PulseMessage[]> {
  try {
    if (typeof window === 'undefined') return INITIAL_PULSE_MESSAGES;
    const raw = window.localStorage.getItem(PULSE_STORAGE_KEY);
    if (!raw) return INITIAL_PULSE_MESSAGES;
    const parsed = JSON.parse(raw);
    return { ...INITIAL_PULSE_MESSAGES, ...parsed };
  } catch {
    return INITIAL_PULSE_MESSAGES;
  }
}

function savePersistedMessages(messages: Record<string, PulseMessage[]>) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PULSE_STORAGE_KEY, JSON.stringify(messages));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function loadPersistedChannels(): PulseChannel[] {
  try {
    if (typeof window === 'undefined') return INITIAL_PULSE_CHANNELS;
    const raw = window.localStorage.getItem(PULSE_PINNED_STORAGE_KEY);
    if (!raw) return INITIAL_PULSE_CHANNELS;
    const resolvedMap: Record<string, string> = JSON.parse(raw);
    return INITIAL_PULSE_CHANNELS.map((ch) =>
      resolvedMap[ch.id]
        ? {
            ...ch,
            pinnedCard: {
              ...ch.pinnedCard,
              selectedOptionId: resolvedMap[ch.id],
            },
          }
        : ch
    );
  } catch {
    return INITIAL_PULSE_CHANNELS;
  }
}

function savePersistedChannels(channels: PulseChannel[]) {
  try {
    if (typeof window !== 'undefined') {
      const map: Record<string, string> = {};
      for (const ch of channels) {
        if (ch.pinnedCard.selectedOptionId) {
          map[ch.id] = ch.pinnedCard.selectedOptionId;
        }
      }
      window.localStorage.setItem(PULSE_PINNED_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore storage errors
  }
}

function loadPersistedRecentCalls(): RecentCallRecord[] {
  try {
    if (typeof window === 'undefined') return INITIAL_RECENT_CALLS;
    const raw = window.localStorage.getItem(RECENT_CALLS_STORAGE_KEY);
    if (!raw) return INITIAL_RECENT_CALLS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RECENT_CALLS;
  } catch {
    return INITIAL_RECENT_CALLS;
  }
}

interface AppStoreState {
  activeScreen: AppScreen;
  setActiveScreen: (screen: AppScreen) => void;

  // Leads & Leads Modal
  leads: LeadRecord[];
  leadModalId: string | null;
  openLeadModal: (leadId: string) => void;
  closeLeadModal: () => void;
  navigateLeadModal: (direction: 'prev' | 'next') => void;

  // Dashboard Tasks
  dashboardTasks: DashboardTask[];
  toggleDashboardTask: (taskId: string) => void;

  // Calls to Make & Incoming Calls & Recent Calls
  incomingCalls: IncomingCallRecord[];
  recentCalls: RecentCallRecord[];
  selectedRecentCallId: string | null;
  setSelectedRecentCallId: (callId: string | null) => void;
  recordCallHistoryEntry: (entry: RecentCallRecord, clearIncomingId?: string) => void;

  // Calendar state
  calendarYear: number;
  calendarMonth: number; // 0-11
  selectedCalendarDate: string; // YYYY-MM-DD
  calendarEvents: CalendarEvent[];
  navigateCalendarMonth: (delta: -1 | 1) => void;
  goToCalendarToday: () => void;
  selectCalendarDate: (dateStr: string) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;

  // Pulse state
  pulseChannels: PulseChannel[];
  activeChannelId: string;
  pulseMessages: Record<string, PulseMessage[]>;
  openPulseChannel: (channelId: string) => void;
  sendPulseMessage: (channelId: string, text: string) => void;
  resolvePinnedCardOption: (channelId: string, optionId: string) => void;
}

const now = new Date();
const initialTodayStr = toDateString(now.getFullYear(), now.getMonth(), now.getDate());

export const useAppStore = create<AppStoreState>((set, get) => ({
  activeScreen: 'dashboard',
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  leads: INITIAL_LEADS,
  leadModalId: null,
  openLeadModal: (leadId) => set({ leadModalId: leadId }),
  closeLeadModal: () => set({ leadModalId: null }),
  navigateLeadModal: (direction) => {
    const { leads, leadModalId } = get();
    if (!leadModalId || leads.length === 0) return;
    const idx = leads.findIndex((l) => l.id === leadModalId);
    if (idx === -1) return;
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % leads.length
        : (idx - 1 + leads.length) % leads.length;
    set({ leadModalId: leads[nextIdx].id });
  },

  dashboardTasks: INITIAL_DASHBOARD_TASKS,
  toggleDashboardTask: (taskId) =>
    set((state) => ({
      dashboardTasks: state.dashboardTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    })),

  incomingCalls: INITIAL_INCOMING_CALLS,
  recentCalls: loadPersistedRecentCalls(),
  selectedRecentCallId: INITIAL_RECENT_CALLS[0]?.id ?? null,
  setSelectedRecentCallId: (callId) => set({ selectedRecentCallId: callId }),
  recordCallHistoryEntry: (entry, clearIncomingId) =>
    set((state) => {
      const updatedRecent = [entry, ...state.recentCalls];
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(RECENT_CALLS_STORAGE_KEY, JSON.stringify(updatedRecent));
        }
      } catch {
        // Ignore storage error
      }
      const updatedIncoming = clearIncomingId
        ? state.incomingCalls.filter((inc) => inc.id !== clearIncomingId)
        : state.incomingCalls;
      return {
        recentCalls: updatedRecent,
        selectedRecentCallId: entry.id,
        incomingCalls: updatedIncoming,
      };
    }),

  calendarYear: now.getFullYear(),
  calendarMonth: now.getMonth(),
  selectedCalendarDate: initialTodayStr,
  calendarEvents: buildInitialCalendarEvents(now),
  navigateCalendarMonth: (delta) =>
    set((state) => {
      const next = navigateMonth(state.calendarYear, state.calendarMonth, delta);
      const firstDayStr = toDateString(next.year, next.month, 1);
      return {
        calendarYear: next.year,
        calendarMonth: next.month,
        selectedCalendarDate: firstDayStr,
      };
    }),
  goToCalendarToday: () => {
    const current = new Date();
    const todayStr = toDateString(
      current.getFullYear(),
      current.getMonth(),
      current.getDate()
    );
    set({
      calendarYear: current.getFullYear(),
      calendarMonth: current.getMonth(),
      selectedCalendarDate: todayStr,
    });
  },
  selectCalendarDate: (dateStr) => set({ selectedCalendarDate: dateStr }),
  addCalendarEvent: (eventInput) =>
    set((state) => ({
      calendarEvents: [
        ...state.calendarEvents,
        {
          ...eventInput,
          id: `evt-${Date.now()}`,
        },
      ],
    })),

  pulseChannels: loadPersistedChannels(),
  activeChannelId: INITIAL_PULSE_CHANNELS[0].id,
  pulseMessages: loadPersistedMessages(),
  openPulseChannel: (channelId) =>
    set((state) => ({
      activeChannelId: channelId,
      activeScreen: 'pulse-channel',
      pulseChannels: state.pulseChannels.map((ch) =>
        ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
      ),
    })),
  sendPulseMessage: (channelId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const formattedTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newMsg: PulseMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: 'user-vaibhav',
      senderName: 'Vaibhav Ruchil',
      senderRole: 'Senior Account Executive',
      isCurrentUser: true,
      text: trimmed,
      timestamp: formattedTime,
    };
    set((state) => {
      const existing = state.pulseMessages[channelId] || [];
      const updated = {
        ...state.pulseMessages,
        [channelId]: [...existing, newMsg],
      };
      savePersistedMessages(updated);
      return {
        pulseMessages: updated,
        pulseChannels: state.pulseChannels.map((ch) =>
          ch.id === channelId ? { ...ch, lastActivity: 'Just now' } : ch
        ),
      };
    });
  },
  resolvePinnedCardOption: (channelId, optionId) => {
    const { pulseChannels, sendPulseMessage } = get();
    const channel = pulseChannels.find((c) => c.id === channelId);
    if (!channel) return;
    const option = channel.pinnedCard.options.find((o) => o.id === optionId);
    if (!option) return;

    const updatedChannels = pulseChannels.map((ch) =>
      ch.id === channelId
        ? {
            ...ch,
            pinnedCard: {
              ...ch.pinnedCard,
              selectedOptionId: optionId,
            },
          }
        : ch
    );
    savePersistedChannels(updatedChannels);
    set({ pulseChannels: updatedChannels });
    sendPulseMessage(channelId, option.autoReplyText);
  },
}));
