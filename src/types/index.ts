export type AppScreen =
  | 'dashboard'
  | 'calls-to-make'
  | 'incoming-calls'
  | 'recent-calls'
  | 'calendar'
  | 'pulse-home'
  | 'pulse-channel';

export type CallState =
  | 'Idle'
  | 'Initiating'
  | 'Ringing'
  | 'Connected'
  | 'Failed'
  | 'Ended';

export type CallTransportMode =
  | 'webrtc-loopback'
  | 'webrtc-p2p'
  | 'pstn-server';

export interface BuyingSignal {
  id: string;
  category: 'High Intent' | 'Tech Stack Fit' | 'Budget & Timing' | 'Champion Activity';
  title: string;
  timestamp: string;
  summary: string;
  detail: string;
  confidenceScore: number;
  source: string;
}

export interface LeadRecord {
  id: string;
  rank: number;
  name: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  phone: string | null;
  email: string;
  icpScore: number;
  intentScore: number;
  compositeScore: number;
  estimatedValue: number;
  stage: 'New High-Intent' | 'Demo Follow-up' | 'Contract Review' | 'Renewal Risk' | 'Callback Requested';
  waitingSince: string;
  waitingMinutes: number;
  lastTouchSummary: string;
  nextRecommendedAction: string;
  notes: string;
  buyingSignals: BuyingSignal[];
}

export interface IncomingCallRecord {
  id: string;
  leadId?: string;
  callerName: string;
  company: string;
  role: string;
  phone: string | null;
  status: 'Missed - SLA Urgent' | 'Queued Callback' | 'Voicemail Left' | 'Abandoned in Queue';
  receivedAt: string;
  waitDurationSeconds: number;
  valueAtStake: number | null;
  reason: string;
  assignedQueue: string;
  attemptsCount: number;
}

export interface RecentCallRecord {
  id: string;
  leadId?: string;
  contactName: string;
  company: string;
  phone: string | null;
  callType: 'Outbound' | 'Incoming' | 'Callback' | 'Practice Call';
  timestamp: string;
  durationSeconds: number | null;
  outcome: 'Connected - Qualified' | 'Connected - Follow-up Set' | 'Missed' | 'No Answer' | 'Failed - Unreachable' | 'Completed';
  recordingAvailable: boolean;
  summaryNotes: string;
  sentiment: 'Positive' | 'Neutral' | 'Action Required' | 'Unknown';
  agentName: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: 'Discovery Call' | 'Closing Review' | 'Callback Slot' | 'Team Sync';
  contactName: string;
  company: string;
  leadId?: string;
  valueAtStake?: number;
  description: string;
}

export interface PulseAgent {
  id: string;
  name: string;
  type: 'avanibot' | 'role-agent' | 'task-agent';
  roleTitle: string;
  status: 'Ready' | 'Processing Queue' | 'Standby';
  specialty: string;
  activeTasksCount: number;
  lastOutput: string;
  metricsLabel: string;
}

export interface PinnedCardOption {
  id: string;
  label: string;
  variant: 'primary' | 'secondary';
  resolutionSummary: string;
  autoReplyText: string;
}

export interface PinnedInputCard {
  id: string;
  title: string;
  contextTag: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  dealValue?: string;
  options: [PinnedCardOption, PinnedCardOption];
  selectedOptionId?: string;
}

export interface PulseMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  isCurrentUser: boolean;
  isAgent?: boolean;
  text: string;
  timestamp: string;
}

export interface PulseChannel {
  id: string;
  name: string;
  topic: string;
  unreadCount: number;
  membersCount: number;
  category: 'Deal Desk' | 'Escalations' | 'Campaigns' | 'Playbooks';
  lastActivity: string;
  pinnedCard: PinnedInputCard;
}

export interface KudosItem {
  id: string;
  recipientName: string;
  recipientRole: string;
  senderName: string;
  message: string;
  metricHighlight: string;
  timestamp: string;
}

export interface DashboardTask {
  id: string;
  leadId: string;
  title: string;
  subtitle: string;
  priority: 'Urgent' | 'High' | 'Standard';
  dueLabel: string;
  completed: boolean;
  valueAtStake: number;
}

export interface DailyMetricPoint {
  day: string;
  dateLabel: string;
  callsMade: number;
  connectedCalls: number;
  pipelineGenerated: number;
  earnings: number;
  avgWaitSeconds: number;
}
