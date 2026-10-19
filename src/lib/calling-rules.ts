import type { CallState, RecentCallRecord } from '../types/index.ts';
import { isValidPhoneNumber } from './formatters.ts';

export interface CallTargetInput {
  contactName: string;
  company: string;
  phone: string | null | undefined;
  leadId?: string;
  callType: 'Outbound' | 'Incoming' | 'Callback' | 'Practice Call';
}

export interface CallValidationResult {
  valid: boolean;
  errorReason: string | null;
}

export function validateCallTarget(target: CallTargetInput): CallValidationResult {
  if (!target.contactName || target.contactName.trim() === '') {
    return {
      valid: false,
      errorReason: 'Cannot initiate call: Contact identity is missing.',
    };
  }
  if (target.callType !== 'Practice Call' && !isValidPhoneNumber(target.phone)) {
    return {
      valid: false,
      errorReason: `Cannot place call to ${target.contactName}: Phone number is unavailable or invalid (${target.phone || 'No number on file'}).`,
    };
  }
  return {
    valid: true,
    errorReason: null,
  };
}

const ALLOWED_TRANSITIONS: Record<CallState, CallState[]> = {
  Idle: ['Initiating', 'Ringing', 'Failed'],
  Initiating: ['Ringing', 'Connected', 'Failed', 'Ended', 'Idle'],
  Ringing: ['Connected', 'Failed', 'Ended', 'Idle'],
  Connected: ['Ended', 'Failed', 'Idle'],
  Failed: ['Idle', 'Initiating'],
  Ended: ['Idle', 'Initiating'],
};

export function canTransitionCallState(from: CallState, to: CallState): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function shouldRecordConnectedCall(
  wasEverConnected: boolean,
  connectedDurationSeconds: number
): boolean {
  return wasEverConnected && connectedDurationSeconds >= 0;
}

/**
 * Pure helper to manage remote ICE candidate buffering before RTCPeerConnection.remoteDescription is set.
 */
export interface IceCandidateQueueState<T = unknown> {
  remoteDescriptionSet: boolean;
  bufferedCandidates: T[];
}

export function createIceCandidateQueue<T = unknown>(): IceCandidateQueueState<T> {
  return {
    remoteDescriptionSet: false,
    bufferedCandidates: [],
  };
}

export function enqueueOrFlushCandidate<T>(
  state: IceCandidateQueueState<T>,
  candidate: T
): { shouldApplyImmediately: boolean; nextState: IceCandidateQueueState<T> } {
  if (state.remoteDescriptionSet) {
    return {
      shouldApplyImmediately: true,
      nextState: state,
    };
  }
  return {
    shouldApplyImmediately: false,
    nextState: {
      remoteDescriptionSet: false,
      bufferedCandidates: [...state.bufferedCandidates, candidate],
    },
  };
}

export function markRemoteDescriptionReady<T>(
  state: IceCandidateQueueState<T>
): { candidatesToFlush: T[]; nextState: IceCandidateQueueState<T> } {
  return {
    candidatesToFlush: [...state.bufferedCandidates],
    nextState: {
      remoteDescriptionSet: true,
      bufferedCandidates: [],
    },
  };
}

export function createVerifiedCallRecord(params: {
  id: string;
  target: CallTargetInput;
  wasConnected: boolean;
  durationSeconds: number;
  failureReason?: string | null;
  timestampIso?: string;
}): RecentCallRecord {
  const dateObj = params.timestampIso ? new Date(params.timestampIso) : new Date();
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!params.wasConnected) {
    return {
      id: params.id,
      leadId: params.target.leadId,
      contactName: params.target.contactName,
      company: params.target.company,
      phone: params.target.phone ?? null,
      callType: params.target.callType,
      timestamp: `Today, ${formattedTime}`,
      durationSeconds: null,
      outcome: 'Failed - Unreachable',
      recordingAvailable: false,
      summaryNotes:
        params.failureReason ||
        'Call attempt did not establish an active audio connection.',
      sentiment: 'Unknown',
      agentName: 'Vaibhav Ruchil',
    };
  }

  return {
    id: params.id,
    leadId: params.target.leadId,
    contactName: params.target.contactName,
    company: params.target.company,
    phone: params.target.phone ?? null,
    callType: params.target.callType,
    timestamp: `Today, ${formattedTime}`,
    durationSeconds: Math.max(1, Math.floor(params.durationSeconds)),
    outcome: 'Completed',
    recordingAvailable: true,
    summaryNotes: `Live WebRTC audio session completed (${Math.max(1, Math.floor(params.durationSeconds))}s connected audio).`,
    sentiment: 'Positive',
    agentName: 'Vaibhav Ruchil',
  };
}
