import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  AlertTriangle,
  X,
  Volume2,
  Radio,
  Settings2,
} from 'lucide-react';
import { useCallingStore } from './useCallingStore.ts';
import { formatCallDuration } from '../../lib/formatters.ts';
import { Button } from '../../components/ui/button.tsx';
import { Dialog } from '../../components/ui/dialog.tsx';
import { useAppStore } from '../../store/useAppStore.ts';

export function CallingDock() {
  const {
    callState,
    transportMode,
    currentTarget,
    errorMessage,
    micSourceLabel,
    iceStateLabel,
    isMuted,
    connectedDurationSeconds,
    audioLevelPercent,
    rtpStats,
    incomingOffer,
    acceptIncomingCall,
    rejectIncomingCall,
    toggleMute,
    endCall,
    resetCallBanner,
  } = useCallingStore();

  if (callState === 'Idle') return null;

  const isIncomingRinging = callState === 'Ringing' && incomingOffer !== null;

  return (
    <section
      aria-label="Active call console"
      className="border-b border-[#1E4633] bg-[#0D261C] px-4 py-2.5 text-white lg:px-6"
    >
      <div className="mx-auto flex max-w-[1360px] flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Call State + Target Contact */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight">
            {callState === 'Connected' && (
              <Radio className="h-3.5 w-3.5 text-[#34D399]" />
            )}
            {callState === 'Failed' && (
              <AlertTriangle className="h-3.5 w-3.5 text-[#F87171]" />
            )}
            {(callState === 'Initiating' || callState === 'Ringing') && (
              <Phone className="h-3.5 w-3.5 text-[#FBBF24]" />
            )}
            <span>State: {callState}</span>
          </div>

          <span aria-hidden="true" className="text-[#567A68]">·</span>

          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="font-semibold text-white truncate">
              {currentTarget?.contactName || 'Unknown Contact'}
            </span>
            <span className="text-[#A7C4B5] truncate">
              ({currentTarget?.company || 'Direct Line'})
            </span>
            <span className="font-mono text-[11px] text-[#9BB8A9] tabular-nums">
              {currentTarget?.phone || 'No phone number'}
            </span>
          </div>

          <span aria-hidden="true" className="hidden sm:inline text-[#567A68]">·</span>

          <span className="font-mono text-[11px] text-[#8AB09D]">
            {iceStateLabel}
          </span>
          {micSourceLabel && callState === 'Connected' && (
            <span className="hidden xl:inline font-mono text-[11px] text-[#6FA088]">
              ({micSourceLabel})
            </span>
          )}
        </div>

        {/* Center/Right: Error alert or Live Audio Meter + Call Controls */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0">
          {callState === 'Failed' && errorMessage && (
            <div
              role="alert"
              className="rounded border border-[#991B1B] bg-[#451212] px-3 py-1 text-xs text-[#FCA5A5]"
            >
              {errorMessage}
            </div>
          )}

          {callState === 'Connected' && (
            <div className="flex items-center gap-3 rounded bg-[#133326] px-3 py-1">
              <span className="font-mono text-xs font-bold tabular-nums text-[#34D399]">
                {formatCallDuration(connectedDurationSeconds)}
              </span>
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-[#34D399]" />
                <div className="h-1.5 w-20 overflow-hidden rounded-sm bg-[#0A1E16]">
                  <div
                    className="h-full bg-[#10B981] transition-transform duration-150 origin-left"
                    style={{
                      transform: `scaleX(${Math.max(
                        0.08,
                        (isMuted ? 0 : audioLevelPercent) / 100
                      )})`,
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[#A7C4B5] tabular-nums">
                  {isMuted ? 'Muted' : `${audioLevelPercent}%`}
                </span>
              </div>
              <span
                title="Verified WebRTC RTP audio packets sent and received"
                className="hidden sm:inline font-mono text-[10px] text-[#6EE7B7] tabular-nums"
              >
                RTP ↑{rtpStats.packetsSent} ↓{rtpStats.packetsReceived} pkts
              </span>
            </div>
          )}

          <span className="hidden md:inline font-mono text-[11px] text-[#8AB09D]">
            {transportMode === 'webrtc-loopback'
              ? 'WebRTC Loopback'
              : transportMode === 'webrtc-p2p'
              ? 'WebRTC P2P'
              : 'PSTN Server'}
          </span>

          {isIncomingRinging ? (
            <div className="flex items-center gap-2">
              <Button
                variant="forest"
                size="xs"
                onClick={acceptIncomingCall}
                className="bg-[#16A34A] hover:bg-[#15803D]"
              >
                <PhoneIncoming className="h-3.5 w-3.5" />
                Accept Call
              </Button>
              <Button
                variant="destructive"
                size="xs"
                onClick={rejectIncomingCall}
              >
                <PhoneOff className="h-3.5 w-3.5" />
                Reject Call
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {(callState === 'Connected' ||
                callState === 'Ringing' ||
                callState === 'Initiating') && (
                <>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={toggleMute}
                    disabled={callState !== 'Connected'}
                    className="border-[#285741] bg-[#163829] text-white hover:bg-[#1F4B38]"
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-3.5 w-3.5 text-[#F87171]" />
                        Unmute Mic
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 text-[#34D399]" />
                        Mute Mic
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={endCall}
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    End Call
                  </Button>
                </>
              )}

              {(callState === 'Ended' || callState === 'Failed') && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={resetCallBanner}
                  aria-label="Dismiss call console"
                  className="border-[#285741] bg-[#163829] text-white hover:bg-[#1F4B38]"
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CallingSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    transportMode,
    setTransportMode,
    wsConnected,
    connectedPeers,
    pstnConfigured,
    missingPstnVars,
    startCall,
    startPracticeCall,
    triggerIncomingTestCall,
  } = useCallingStore();
  const leads = useAppStore((s) => s.leads);
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || 'lead-101');

  const handleDialSelectedLead = async () => {
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;
    onClose();
    await startCall({
      contactName: lead.name,
      company: lead.company,
      phone: lead.phone,
      leadId: lead.id,
      callType: 'Outbound',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Telephony & WebRTC Audio Configuration"
      description="Configure real-time WebRTC audio transport, inspect signaling status, or test inbound/outbound calling."
    >
      <div className="space-y-5 text-xs">
        <div className="space-y-2">
          <label className="block font-semibold text-[#111814]">
            Active Calling Transport Mode
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setTransportMode('webrtc-loopback')}
              className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                transportMode === 'webrtc-loopback'
                  ? 'border-[#112E22] bg-[#F1F6F3]'
                  : 'border-[#DCE1DA] bg-white hover:bg-[#F8FAF7]'
              }`}
            >
              <div className="font-semibold text-[#111814]">1. WebRTC Loopback</div>
              <p className="mt-1 text-[11px] text-[#526058]">
                Dual RTCPeerConnection bridge in-browser. Acquires mic, negotiates ICE/SDP, and streams live RTP audio immediately.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTransportMode('webrtc-p2p')}
              className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                transportMode === 'webrtc-p2p'
                  ? 'border-[#112E22] bg-[#F1F6F3]'
                  : 'border-[#DCE1DA] bg-white hover:bg-[#F8FAF7]'
              }`}
            >
              <div className="font-semibold text-[#111814]">2. WebRTC Multi-Tab P2P</div>
              <p className="mt-1 text-[11px] text-[#526058]">
                Uses WebSocket (/ws/signaling) & BroadcastChannel to ring a second browser tab/window with Accept/Reject.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTransportMode('pstn-server')}
              className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                transportMode === 'pstn-server'
                  ? 'border-[#112E22] bg-[#F1F6F3]'
                  : 'border-[#DCE1DA] bg-white hover:bg-[#F8FAF7]'
              }`}
            >
              <div className="font-semibold text-[#111814]">3. Server PSTN (Twilio)</div>
              <p className="mt-1 text-[11px] text-[#526058]">
                Calls server-side /api/telephony/call. Reports honest missing-credential blocker if TWILIO_* env vars are unset.
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-md border border-[#DCE1DA] bg-[#F8FAF7] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#111814]">Signaling & Provider Diagnostics</span>
            <span className="font-mono text-[11px] text-[#2B4C3B]">
              WS Signaling: {wsConnected ? 'Connected (/ws/signaling)' : 'BroadcastChannel Active'}
            </span>
          </div>
          <p className="text-[11px] text-[#4A5750]">
            Connected Signaling Peers: <span className="font-mono font-semibold tabular-nums">{connectedPeers.length}</span>{' '}
            · Server PSTN Configured:{' '}
            <span className="font-mono font-semibold">
              {pstnConfigured ? 'Yes (Twilio Ready)' : `No (Missing: ${missingPstnVars.join(', ')})`}
            </span>
          </p>
        </div>

        <div className="space-y-2 border-t border-[#E4E8E2] pt-4">
          <label htmlFor="dial-lead-select" className="block font-semibold text-[#111814]">
            Quick Dial Destination Lead
          </label>
          <div className="flex items-center gap-2">
            <select
              id="dial-lead-select"
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="h-9 flex-1 rounded-md border border-[#D0D7CE] bg-white px-3 text-xs text-[#111814] focus:outline-none focus:ring-2 focus:ring-[#112E22]"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.rank} {l.name} — {l.company} ({l.phone || 'No Phone / Invalid'})
                </option>
              ))}
            </select>
            <Button variant="forest" onClick={handleDialSelectedLead}>
              <Phone className="h-3.5 w-3.5" />
              Initiate Call
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E4E8E2] pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                startPracticeCall();
              }}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Start Practice Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                triggerIncomingTestCall();
              }}
            >
              <PhoneIncoming className="h-3.5 w-3.5" />
              Test Incoming Call Ring
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
