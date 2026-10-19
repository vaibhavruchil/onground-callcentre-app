import { create } from 'zustand';
import type { CallState, CallTransportMode } from '../../types/index.ts';
import {
  validateCallTarget,
  createVerifiedCallRecord,
  createIceCandidateQueue,
  enqueueOrFlushCandidate,
  markRemoteDescriptionReady,
  type CallTargetInput,
} from '../../lib/calling-rules.ts';
import { useAppStore } from '../../store/useAppStore.ts';

interface PeerSummary {
  peerId: string;
  role: 'agent' | 'contact';
  name: string;
}

interface IncomingSignalOffer {
  callId: string;
  fromPeerId: string;
  callerName: string;
  company: string;
  phone: string | null;
  sdpOffer: RTCSessionDescriptionInit;
}

export interface RtpTransportStats {
  packetsSent: number;
  packetsReceived: number;
  bytesSent: number;
  bytesReceived: number;
}

interface CallingStoreState {
  callState: CallState;
  transportMode: CallTransportMode;
  userManuallySelectedMode: boolean;
  setTransportMode: (mode: CallTransportMode) => void;

  currentTarget: CallTargetInput | null;
  clearIncomingIdOnComplete: string | undefined;
  errorMessage: string | null;
  micSourceLabel: string | null;
  iceStateLabel: string;
  isMuted: boolean;
  connectedDurationSeconds: number;
  audioLevelPercent: number;
  rtpStats: RtpTransportStats;

  // Signaling & Peer status
  localPeerId: string;
  wsConnected: boolean;
  connectedPeers: PeerSummary[];
  pstnConfigured: boolean;
  missingPstnVars: string[];
  incomingOffer: IncomingSignalOffer | null;

  // Actions
  initSignaling: () => void;
  startCall: (target: CallTargetInput, clearIncomingId?: string) => Promise<void>;
  startPracticeCall: () => Promise<void>;
  triggerIncomingTestCall: () => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  toggleMute: () => void;
  endCall: () => void;
  resetCallBanner: () => void;
}

// Internal runtime references for WebRTC & Audio cleanup
let localStream: MediaStream | null = null;
let syntheticAudioCtx: AudioContext | null = null;
let levelAnalyserCtx: AudioContext | null = null;
let remotePlaybackAudioCtx: AudioContext | null = null;
let levelIntervalId: ReturnType<typeof setInterval> | null = null;
let audioRelayIntervalId: ReturnType<typeof setInterval> | null = null;
let durationIntervalId: ReturnType<typeof setInterval> | null = null;
let ringingTimeoutId: ReturnType<typeof setTimeout> | null = null;

let callerPc: RTCPeerConnection | null = null;
let loopbackCalleePc: RTCPeerConnection | null = null;
let remoteAudioElement: HTMLAudioElement | null = null;

let signalingSocket: WebSocket | null = null;
let broadcastChannel: BroadcastChannel | null = null;
let activeCallId: string | null = null;
let activeRemotePeerId: string | null = null;
let wasEverConnected = false;

let relayStats: RtpTransportStats = {
  packetsSent: 0,
  packetsReceived: 0,
  bytesSent: 0,
  bytesReceived: 0,
};

// ICE candidate buffer for P2P calls (buffers candidates arriving before setRemoteDescription resolves)
let p2pIceQueue = createIceCandidateQueue<RTCIceCandidateInit>();
const seenPacketIds = new Set<string>();

function getIceServers(): RTCIceServer[] {
  const stunUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STUN_URL) ||
    'stun:stun.l.google.com:19302';
  const servers: RTCIceServer[] = [{ urls: stunUrl }];

  const turnUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TURN_URL : '';
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env?.VITE_TURN_USERNAME || undefined,
      credential: import.meta.env?.VITE_TURN_CREDENTIAL || undefined,
    });
  }
  return servers;
}

function cleanupCallResources() {
  if (ringingTimeoutId) {
    clearTimeout(ringingTimeoutId);
    ringingTimeoutId = null;
  }
  if (durationIntervalId) {
    clearInterval(durationIntervalId);
    durationIntervalId = null;
  }
  if (levelIntervalId) {
    clearInterval(levelIntervalId);
    levelIntervalId = null;
  }
  if (audioRelayIntervalId) {
    clearInterval(audioRelayIntervalId);
    audioRelayIntervalId = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore
      }
    });
    localStream = null;
  }
  if (callerPc) {
    try {
      callerPc.ontrack = null;
      callerPc.onicecandidate = null;
      callerPc.onconnectionstatechange = null;
      callerPc.oniceconnectionstatechange = null;
      callerPc.close();
    } catch {
      // ignore
    }
    callerPc = null;
  }
  if (loopbackCalleePc) {
    try {
      loopbackCalleePc.ontrack = null;
      loopbackCalleePc.onicecandidate = null;
      loopbackCalleePc.onconnectionstatechange = null;
      loopbackCalleePc.oniceconnectionstatechange = null;
      loopbackCalleePc.close();
    } catch {
      // ignore
    }
    loopbackCalleePc = null;
  }
  if (remoteAudioElement) {
    try {
      remoteAudioElement.pause();
      remoteAudioElement.srcObject = null;
    } catch {
      // ignore
    }
    remoteAudioElement = null;
  }
  if (syntheticAudioCtx) {
    try {
      syntheticAudioCtx.close();
    } catch {
      // ignore
    }
    syntheticAudioCtx = null;
  }
  if (levelAnalyserCtx) {
    try {
      levelAnalyserCtx.close();
    } catch {
      // ignore
    }
    levelAnalyserCtx = null;
  }
  if (remotePlaybackAudioCtx) {
    try {
      remotePlaybackAudioCtx.close();
    } catch {
      // ignore
    }
    remotePlaybackAudioCtx = null;
  }
  activeRemotePeerId = null;
  relayStats = { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 };
  p2pIceQueue = createIceCandidateQueue<RTCIceCandidateInit>();
}

async function acquireMicrophoneOrFallback(): Promise<{
  stream: MediaStream;
  label: string;
}> {
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      const trackLabel = stream.getAudioTracks()[0]?.label || 'Hardware Microphone';
      return { stream, label: `Mic: ${trackLabel}` };
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : '';
      // If user explicitly denied microphone permission, throw so we report the real permission error
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        throw new Error(
          'Microphone permission was denied by the browser. Please allow microphone access in your browser address bar settings and try again.'
        );
      }
      // If running in a headless container or workstation without physical audio hardware (NotFoundError),
      // create a genuine WebAudio MediaStream track so WebRTC RTP media negotiation can still be verified.
    }
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  syntheticAudioCtx = new AudioCtx();
  const dest = syntheticAudioCtx.createMediaStreamDestination();
  const osc = syntheticAudioCtx.createOscillator();
  const gain = syntheticAudioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, syntheticAudioCtx.currentTime);
  gain.gain.setValueAtTime(0.08, syntheticAudioCtx.currentTime);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  return {
    stream: dest.stream,
    label: 'WebAudio Synthesizer Track (No hardware mic detected)',
  };
}

function attachAudioLevelMonitor(
  stream: MediaStream,
  onLevel: (percent: number) => void
) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    levelAnalyserCtx = new AudioCtx();
    const source = levelAnalyserCtx.createMediaStreamSource(stream);
    const analyser = levelAnalyserCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    levelIntervalId = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(100, Math.round((avg / 96) * 100));
      onLevel(normalized);
    }, 150);
  } catch {
    onLevel(25);
  }
}

function startLiveAudioStreamRelay(
  stream: MediaStream,
  callId: string,
  localPeerId: string,
  targetPeerId?: string
) {
  if (audioRelayIntervalId) {
    clearInterval(audioRelayIntervalId);
    audioRelayIntervalId = null;
  }

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const captureCtx = levelAnalyserCtx || new AudioCtx();
    if (!levelAnalyserCtx) {
      levelAnalyserCtx = captureCtx;
    }
    const source = captureCtx.createMediaStreamSource(stream);
    const analyser = captureCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    const timeDomain = new Float32Array(analyser.fftSize);

    audioRelayIntervalId = setInterval(() => {
      const trackEnabled = stream.getAudioTracks()[0]?.enabled ?? false;
      analyser.getFloatTimeDomainData(timeDomain);

      // Downsample 32 float PCM samples for real-time transport
      const samples: number[] = [];
      for (let i = 0; i < timeDomain.length; i += 4) {
        samples.push(trackEnabled ? Number(timeDomain[i].toFixed(4)) : 0);
      }

      const payloadBytes = samples.length * 4;
      relayStats.packetsSent += 1;
      relayStats.bytesSent += payloadBytes;

      sendSignalingPacket({
        type: 'webrtc:audio-frame',
        callId,
        fromPeerId: localPeerId,
        targetPeerId,
        samples,
        muted: !trackEnabled,
      });
    }, 200);
  } catch {
    // Fallback if AudioContext is restricted
  }
}

function playIncomingPcmFrame(samples: number[]) {
  if (!Array.isArray(samples) || samples.length === 0) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!remotePlaybackAudioCtx) {
      remotePlaybackAudioCtx = new AudioCtx();
    }
    if (remotePlaybackAudioCtx.state === 'suspended') {
      remotePlaybackAudioCtx.resume().catch(() => {});
    }
    const buffer = remotePlaybackAudioCtx.createBuffer(
      1,
      samples.length,
      remotePlaybackAudioCtx.sampleRate
    );
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      channelData[i] = Number(samples[i]) || 0;
    }
    const src = remotePlaybackAudioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(remotePlaybackAudioCtx.destination);
    src.start();
  } catch {
    // Ignore in environments without audio output device
  }
}

function playRemoteStream(stream: MediaStream) {
  try {
    remoteAudioElement = new Audio();
    remoteAudioElement.autoplay = true;
    remoteAudioElement.srcObject = stream;
    remoteAudioElement.play().catch(() => {
      // Autoplay policy handled gracefully
    });
  } catch {
    // Ignore in environments without HTMLAudioElement
  }
}

async function pollPeerConnectionRtpStats(
  pc: RTCPeerConnection | null
): Promise<RtpTransportStats> {
  let packetsSent = relayStats.packetsSent;
  let packetsReceived = relayStats.packetsReceived;
  let bytesSent = relayStats.bytesSent;
  let bytesReceived = relayStats.bytesReceived;

  if (pc) {
    try {
      const report = await pc.getStats();
      report.forEach((stat) => {
        if (stat.type === 'outbound-rtp') {
          packetsSent += Number(stat.packetsSent || 0);
          bytesSent += Number(stat.bytesSent || 0);
        } else if (stat.type === 'inbound-rtp') {
          packetsReceived += Number(stat.packetsReceived || 0);
          bytesReceived += Number(stat.bytesReceived || 0);
        }
      });
    } catch {
      // Use relayStats
    }
  }

  return { packetsSent, packetsReceived, bytesSent, bytesReceived };
}

function sendSignalingPacket(packet: Record<string, unknown>) {
  const packetWithId = {
    ...packet,
    packetId:
      typeof packet.packetId === 'string'
        ? packet.packetId
        : `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
  seenPacketIds.add(packetWithId.packetId);

  const serialized = JSON.stringify(packetWithId);
  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
    signalingSocket.send(serialized);
  } else if (broadcastChannel) {
    // Fallback to BroadcastChannel when running as a static SPA without WebSocket server
    try {
      broadcastChannel.postMessage(packetWithId);
    } catch {
      // Ignore
    }
  }
}

const initialPeerId = `peer-${Math.random().toString(36).slice(2, 8)}`;

export const useCallingStore = create<CallingStoreState>((set, get) => ({
  callState: 'Idle',
  transportMode: 'webrtc-loopback',
  userManuallySelectedMode: false,
  setTransportMode: (mode) =>
    set({ transportMode: mode, userManuallySelectedMode: true, errorMessage: null }),

  currentTarget: null,
  clearIncomingIdOnComplete: undefined,
  errorMessage: null,
  micSourceLabel: null,
  iceStateLabel: 'Standby',
  isMuted: false,
  connectedDurationSeconds: 0,
  audioLevelPercent: 0,
  rtpStats: { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 },

  localPeerId: initialPeerId,
  wsConnected: false,
  connectedPeers: [],
  pstnConfigured: false,
  missingPstnVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
  incomingOffer: null,

  initSignaling: () => {
    if (typeof window === 'undefined') return;

    // Fetch server-side telephony status
    fetch('/api/telephony/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          set({
            pstnConfigured: Boolean(data.pstnConfigured),
            missingPstnVars: Array.isArray(data.missingEnvVars) ? data.missingEnvVars : [],
          });
        }
      })
      .catch(() => {
        // Static deployment fallback
      });

    // Set up cross-tab BroadcastChannel signaling fallback
    if ('BroadcastChannel' in window && !broadcastChannel) {
      broadcastChannel = new BroadcastChannel('onground-webrtc-signaling');
      broadcastChannel.onmessage = (ev) => {
        handleIncomingSignalingPacket(ev.data, set, get);
      };
    }

    // Set up WebSocket signaling to Express server (/ws/signaling)
    if (!signalingSocket || signalingSocket.readyState === WebSocket.CLOSED) {
      try {
        const customWsUrl = import.meta.env?.VITE_SIGNALING_WS_URL;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = customWsUrl || `${protocol}//${window.location.host}/ws/signaling`;
        const ws = new WebSocket(wsUrl);
        signalingSocket = ws;

        ws.onopen = () => {
          set({ wsConnected: true });
          ws.send(
            JSON.stringify({
              type: 'peer:register',
              peerId: get().localPeerId,
              role: 'agent',
              name: `Workstation (${get().localPeerId})`,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'peers:list' && Array.isArray(msg.peers)) {
              const peers: PeerSummary[] = msg.peers;
              const updates: Partial<CallingStoreState> = { connectedPeers: peers };
              // Automatically switch to P2P mode when 2+ separate clients are connected
              // unless the user explicitly locked a specific mode in the modal
              if (!get().userManuallySelectedMode) {
                updates.transportMode = peers.length >= 2 ? 'webrtc-p2p' : 'webrtc-loopback';
              }
              set(updates);
              return;
            }
            handleIncomingSignalingPacket(msg, set, get);
          } catch {
            // ignore malformed packet
          }
        };

        ws.onclose = () => {
          set({ wsConnected: false });
        };
      } catch {
        set({ wsConnected: false });
      }
    }
  },

  startCall: async (target, clearIncomingId) => {
    const currentState = get().callState;
    if (currentState === 'Initiating' || currentState === 'Ringing' || currentState === 'Connected') {
      cleanupCallResources();
    }

    // Step 1: Validate target contact details honestly
    const validation = validateCallTarget(target);
    if (!validation.valid) {
      set({
        callState: 'Failed',
        currentTarget: target,
        errorMessage: validation.errorReason,
        iceStateLabel: 'Validation Failed',
        connectedDurationSeconds: 0,
      });
      return;
    }

    wasEverConnected = false;
    activeCallId = `call-${Date.now()}`;
    activeRemotePeerId = null;
    relayStats = { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 };
    p2pIceQueue = createIceCandidateQueue<RTCIceCandidateInit>();

    set({
      callState: 'Initiating',
      currentTarget: target,
      clearIncomingIdOnComplete: clearIncomingId,
      errorMessage: null,
      isMuted: false,
      connectedDurationSeconds: 0,
      audioLevelPercent: 0,
      rtpStats: { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 },
      iceStateLabel: 'Requesting Microphone...',
    });

    const mode = get().transportMode;

    // Mode C: Server-side PSTN Provider check
    if (mode === 'pstn-server') {
      try {
        set({ iceStateLabel: 'Contacting PSTN Gateway...' });
        const resp = await fetch('/api/telephony/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toPhone: target.phone,
            leadName: target.contactName,
          }),
        });
        const body = await resp.json();
        if (!resp.ok || !body.ok) {
          set({
            callState: 'Failed',
            errorMessage:
              body.message ||
              'PSTN call could not be placed because provider credentials are not configured.',
            iceStateLabel: body.errorCode || 'PSTN Unavailable',
          });
          return;
        }
        set({
          callState: 'Ringing',
          iceStateLabel: `Twilio SID: ${body.callSid}`,
        });
      } catch (err) {
        set({
          callState: 'Failed',
          errorMessage:
            err instanceof Error
              ? err.message
              : 'Unable to reach server PSTN endpoint.',
          iceStateLabel: 'Gateway Unreachable',
        });
      }
      return;
    }

    // Acquire real microphone stream (or WebAudio fallback if no hardware mic in headless environment)
    let acquired: { stream: MediaStream; label: string };
    try {
      acquired = await acquireMicrophoneOrFallback();
      localStream = acquired.stream;
      set({ micSourceLabel: acquired.label });
    } catch (micErr) {
      cleanupCallResources();
      set({
        callState: 'Failed',
        errorMessage:
          micErr instanceof Error
            ? micErr.message
            : 'Microphone access failed.',
        iceStateLabel: 'Mic Permission Denied',
      });
      return;
    }

    // Create real RTCPeerConnection
    try {
      const iceServers = mode === 'webrtc-loopback' ? [] : getIceServers();
      callerPc = new RTCPeerConnection({ iceServers });

      localStream.getTracks().forEach((track) => {
        callerPc!.addTrack(track, localStream!);
      });

      const markCallConnected = () => {
        if (wasEverConnected) return;
        wasEverConnected = true;
        set({
          callState: 'Connected',
          iceStateLabel:
            mode === 'webrtc-loopback'
              ? 'WebRTC Connected (Loopback RTP Bridge)'
              : 'WebRTC Connected (P2P Audio)',
          connectedDurationSeconds: 0,
        });

        if (localStream) {
          attachAudioLevelMonitor(localStream, (pct) => {
            if (!get().isMuted && get().callState === 'Connected') {
              set({ audioLevelPercent: Math.max(18, pct) });
            } else {
              set({ audioLevelPercent: 0 });
            }
          });
        }

        if (durationIntervalId) clearInterval(durationIntervalId);
        durationIntervalId = setInterval(async () => {
          const stats = await pollPeerConnectionRtpStats(callerPc);
          set((s) => ({
            connectedDurationSeconds: s.connectedDurationSeconds + 1,
            rtpStats: stats,
          }));
        }, 1000);
      };

      callerPc.onconnectionstatechange = () => {
        if (!callerPc) return;
        const st = callerPc.connectionState;
        if (st === 'connected') {
          markCallConnected();
        } else if (st === 'failed' || st === 'disconnected') {
          cleanupCallResources();
          set({
            callState: 'Failed',
            errorMessage: `WebRTC ICE connection ${st}. Check network or TURN configuration.`,
            iceStateLabel: `ICE ${st}`,
          });
        }
      };

      callerPc.oniceconnectionstatechange = () => {
        if (!callerPc) return;
        const iceSt = callerPc.iceConnectionState;
        if (iceSt === 'connected' || iceSt === 'completed') {
          markCallConnected();
        }
      };

      callerPc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          playRemoteStream(event.streams[0]);
        }
      };

      if (mode === 'webrtc-loopback') {
        // Real Dual-RTCPeerConnection Loopback Bridge in browser
        loopbackCalleePc = new RTCPeerConnection({ iceServers: [] });

        const callerCandidatesQueue: RTCIceCandidate[] = [];
        const calleeCandidatesQueue: RTCIceCandidate[] = [];
        let calleeRemoteSet = false;
        let callerRemoteSet = false;

        callerPc.onicecandidate = (e) => {
          if (!e.candidate || !loopbackCalleePc) return;
          if (calleeRemoteSet) {
            loopbackCalleePc.addIceCandidate(e.candidate).catch(() => {});
          } else {
            callerCandidatesQueue.push(e.candidate);
          }
        };

        loopbackCalleePc.onicecandidate = (e) => {
          if (!e.candidate || !callerPc) return;
          if (callerRemoteSet) {
            callerPc.addIceCandidate(e.candidate).catch(() => {});
          } else {
            calleeCandidatesQueue.push(e.candidate);
          }
        };

        // Loopback responder sends audio track back across RTP channel
        localStream.getTracks().forEach((track) => {
          loopbackCalleePc!.addTrack(track, localStream!);
        });

        set({
          callState: 'Ringing',
          iceStateLabel: 'Ringing Contact (WebRTC SDP Offer Sent)...',
        });

        ringingTimeoutId = setTimeout(async () => {
          if (!callerPc || !loopbackCalleePc || get().callState !== 'Ringing') return;
          try {
            const offer = await callerPc.createOffer();
            await callerPc.setLocalDescription(offer);

            await loopbackCalleePc.setRemoteDescription(offer);
            calleeRemoteSet = true;
            for (const c of callerCandidatesQueue) {
              loopbackCalleePc.addIceCandidate(c).catch(() => {});
            }

            const answer = await loopbackCalleePc.createAnswer();
            await loopbackCalleePc.setLocalDescription(answer);

            await callerPc.setRemoteDescription(answer);
            callerRemoteSet = true;
            for (const c of calleeCandidatesQueue) {
              callerPc.addIceCandidate(c).catch(() => {});
            }

            if (
              callerPc.signalingState === 'stable' &&
              loopbackCalleePc.signalingState === 'stable'
            ) {
              markCallConnected();
            }
          } catch (handshakeErr) {
            cleanupCallResources();
            set({
              callState: 'Failed',
              errorMessage:
                handshakeErr instanceof Error
                  ? handshakeErr.message
                  : 'WebRTC SDP negotiation failed.',
              iceStateLabel: 'SDP Handshake Error',
            });
          }
        }, 450);
      } else {
        // Multi-Tab / Multi-Browser P2P WebRTC Mode via WebSocket & BroadcastChannel
        callerPc.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignalingPacket({
              type: 'webrtc:ice-candidate',
              callId: activeCallId,
              fromPeerId: get().localPeerId,
              candidate: e.candidate.toJSON(),
            });
          }
        };

        const offer = await callerPc.createOffer();
        await callerPc.setLocalDescription(offer);

        set({
          callState: 'Ringing',
          iceStateLabel: 'Ringing Peer Client (Waiting for Accept)...',
        });

        sendSignalingPacket({
          type: 'call:invite',
          callId: activeCallId,
          fromPeerId: get().localPeerId,
          callerName: target.contactName,
          company: target.company,
          phone: target.phone,
          sdpOffer: { type: offer.type, sdp: offer.sdp },
        });

        // Timeout if no peer answers within 25 seconds
        ringingTimeoutId = setTimeout(() => {
          if (get().callState === 'Ringing') {
            cleanupCallResources();
            set({
              callState: 'Failed',
              errorMessage:
                'No remote browser peer answered within 25 seconds. Open a second browser tab/window or switch to WebRTC Loopback mode.',
              iceStateLabel: 'No Answer (Peer Timeout)',
            });
          }
        }, 25000);
      }
    } catch (rtcErr) {
      cleanupCallResources();
      set({
        callState: 'Failed',
        errorMessage:
          rtcErr instanceof Error
            ? rtcErr.message
            : 'Failed to initialize WebRTC RTCPeerConnection.',
        iceStateLabel: 'WebRTC Error',
      });
    }
  },

  startPracticeCall: async () => {
    set({ transportMode: 'webrtc-loopback', userManuallySelectedMode: true });
    await get().startCall({
      contactName: 'AvaniBot Voice Calibration Bridge',
      company: 'On-Ground.ai Practice Sandbox',
      phone: '+1 800 555 0199',
      callType: 'Practice Call',
    });
  },

  triggerIncomingTestCall: async () => {
    const currentState = get().callState;
    if (currentState !== 'Idle' && currentState !== 'Ended' && currentState !== 'Failed') {
      cleanupCallResources();
    }

    try {
      loopbackCalleePc = new RTCPeerConnection({ iceServers: [] });
      const acquired = await acquireMicrophoneOrFallback();
      localStream = acquired.stream;
      localStream.getTracks().forEach((t) => loopbackCalleePc!.addTrack(t, localStream!));

      const offer = await loopbackCalleePc.createOffer();

      const simulatedCallId = `inc-live-${Date.now()}`;
      activeCallId = simulatedCallId;
      p2pIceQueue = createIceCandidateQueue<RTCIceCandidateInit>();

      set({
        callState: 'Ringing',
        currentTarget: {
          contactName: 'Priya Nair',
          company: 'Aether Health',
          phone: '+91 98201 77412',
          leadId: 'lead-103',
          callType: 'Incoming',
        },
        incomingOffer: {
          callId: simulatedCallId,
          fromPeerId: 'local-inbound-bridge',
          callerName: 'Priya Nair',
          company: 'Aether Health',
          phone: '+91 98201 77412',
          sdpOffer: { type: offer.type, sdp: offer.sdp },
        },
        errorMessage: null,
        iceStateLabel: 'Incoming WebRTC Call Ringing...',
      });
    } catch (err) {
      cleanupCallResources();
      set({
        callState: 'Failed',
        errorMessage:
          err instanceof Error ? err.message : 'Could not initialize incoming call offer.',
      });
    }
  },

  acceptIncomingCall: async () => {
    const offerInfo = get().incomingOffer;
    if (!offerInfo) return;

    wasEverConnected = false;
    activeRemotePeerId = offerInfo.fromPeerId;
    relayStats = { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 };

    set({
      callState: 'Initiating',
      iceStateLabel: 'Accepting & Negotiating ICE...',
      errorMessage: null,
      rtpStats: { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 },
    });

    try {
      if (!localStream) {
        const acquired = await acquireMicrophoneOrFallback();
        localStream = acquired.stream;
        set({ micSourceLabel: acquired.label });
      } else {
        set({ micSourceLabel: 'Mic: Active Stream' });
      }

      const isLocalInbound = offerInfo.fromPeerId === 'local-inbound-bridge';
      const iceServers = isLocalInbound ? [] : getIceServers();
      callerPc = new RTCPeerConnection({ iceServers });

      localStream.getTracks().forEach((track) => {
        callerPc!.addTrack(track, localStream!);
      });

      const onConnected = () => {
        if (wasEverConnected) return;
        wasEverConnected = true;
        set({
          callState: 'Connected',
          incomingOffer: null,
          iceStateLabel: isLocalInbound
            ? 'WebRTC Connected (Inbound Bridge)'
            : 'WebRTC Connected (P2P Audio)',
          connectedDurationSeconds: 0,
        });

        if (localStream) {
          attachAudioLevelMonitor(localStream, (pct) => {
            if (!get().isMuted && get().callState === 'Connected') {
              set({ audioLevelPercent: Math.max(18, pct) });
            } else {
              set({ audioLevelPercent: 0 });
            }
          });
        }

        if (durationIntervalId) clearInterval(durationIntervalId);
        durationIntervalId = setInterval(async () => {
          const stats = await pollPeerConnectionRtpStats(callerPc);
          set((s) => ({
            connectedDurationSeconds: s.connectedDurationSeconds + 1,
            rtpStats: stats,
          }));
        }, 1000);
      };

      callerPc.onconnectionstatechange = () => {
        if (callerPc?.connectionState === 'connected') onConnected();
      };
      callerPc.oniceconnectionstatechange = () => {
        const st = callerPc?.iceConnectionState;
        if (st === 'connected' || st === 'completed') onConnected();
      };
      callerPc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          playRemoteStream(event.streams[0]);
        }
      };

      if (isLocalInbound && loopbackCalleePc) {
        const calleeQueue: RTCIceCandidate[] = [];
        const callerQueue: RTCIceCandidate[] = [];
        let callerHasRemote = false;
        let calleeHasRemote = false;

        loopbackCalleePc.onicecandidate = (e) => {
          if (!e.candidate || !callerPc) return;
          if (callerHasRemote) {
            callerPc.addIceCandidate(e.candidate).catch(() => {});
          } else {
            calleeQueue.push(e.candidate);
          }
        };
        callerPc.onicecandidate = (e) => {
          if (!e.candidate || !loopbackCalleePc) return;
          if (calleeHasRemote) {
            loopbackCalleePc.addIceCandidate(e.candidate).catch(() => {});
          } else {
            callerQueue.push(e.candidate);
          }
        };

        await loopbackCalleePc.setLocalDescription(offerInfo.sdpOffer);
        await callerPc.setRemoteDescription(offerInfo.sdpOffer);
        callerHasRemote = true;
        for (const c of calleeQueue) {
          callerPc.addIceCandidate(c).catch(() => {});
        }

        const answer = await callerPc.createAnswer();
        await callerPc.setLocalDescription(answer);
        await loopbackCalleePc.setRemoteDescription(answer);
        calleeHasRemote = true;
        for (const c of callerQueue) {
          loopbackCalleePc.addIceCandidate(c).catch(() => {});
        }

        if (
          callerPc.signalingState === 'stable' &&
          loopbackCalleePc.signalingState === 'stable'
        ) {
          onConnected();
        }
      } else {
        callerPc.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignalingPacket({
              type: 'webrtc:ice-candidate',
              callId: offerInfo.callId,
              fromPeerId: get().localPeerId,
              targetPeerId: offerInfo.fromPeerId,
              candidate: e.candidate.toJSON(),
            });
          }
        };

        await callerPc.setRemoteDescription(new RTCSessionDescription(offerInfo.sdpOffer));

        const answer = await callerPc.createAnswer();
        await callerPc.setLocalDescription(answer);

        // Send SDP answer immediately so the caller can setRemoteDescription without waiting on mDNS/ICE
        sendSignalingPacket({
          type: 'webrtc:answer',
          callId: offerInfo.callId,
          fromPeerId: get().localPeerId,
          targetPeerId: offerInfo.fromPeerId,
          sdpAnswer: { type: answer.type, sdp: answer.sdp },
        });

        // Flush any remote ICE candidates that arrived from the caller while ringing (non-blocking)
        const flushed = markRemoteDescriptionReady(p2pIceQueue);
        p2pIceQueue = flushed.nextState;
        for (const cand of flushed.candidatesToFlush) {
          callerPc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }

        // Start live bidirectional PCM audio stream relay alongside WebRTC SRTP
        if (localStream) {
          startLiveAudioStreamRelay(
            localStream,
            offerInfo.callId,
            get().localPeerId,
            offerInfo.fromPeerId
          );
        }
        onConnected();
      }
    } catch (err) {
      cleanupCallResources();
      set({
        callState: 'Failed',
        incomingOffer: null,
        errorMessage:
          err instanceof Error ? err.message : 'Failed to accept incoming WebRTC call.',
      });
    }
  },

  rejectIncomingCall: () => {
    const offerInfo = get().incomingOffer;
    if (offerInfo && offerInfo.fromPeerId !== 'local-inbound-bridge') {
      sendSignalingPacket({
        type: 'call:reject',
        callId: offerInfo.callId,
        fromPeerId: get().localPeerId,
        targetPeerId: offerInfo.fromPeerId,
      });
    }
    cleanupCallResources();
    set({
      callState: 'Ended',
      incomingOffer: null,
      iceStateLabel: 'Call Rejected',
    });
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    set({
      isMuted: nextMuted,
      audioLevelPercent: nextMuted ? 0 : get().audioLevelPercent,
    });
  },

  endCall: () => {
    const { currentTarget, connectedDurationSeconds, clearIncomingIdOnComplete } = get();
    const genuinelyConnected = wasEverConnected;
    const callIdToClose = activeCallId;

    // Clear activeCallId before sending packet so re-entrant call:end messages are ignored
    wasEverConnected = false;
    activeCallId = null;

    if (callIdToClose) {
      sendSignalingPacket({
        type: 'call:end',
        callId: callIdToClose,
        fromPeerId: get().localPeerId,
      });
    }

    cleanupCallResources();

    // Only log a connected call in Recent Calls if it was genuinely connected!
    if (currentTarget && genuinelyConnected) {
      const record = createVerifiedCallRecord({
        id: `rec-live-${Date.now()}`,
        target: currentTarget,
        wasConnected: true,
        durationSeconds: Math.max(1, connectedDurationSeconds),
      });
      useAppStore.getState().recordCallHistoryEntry(record, clearIncomingIdOnComplete);
    }

    set({
      callState: 'Ended',
      incomingOffer: null,
      iceStateLabel: genuinelyConnected
        ? `Call Ended (${Math.max(1, connectedDurationSeconds)}s)`
        : 'Call Cancelled',
      audioLevelPercent: 0,
    });
  },

  resetCallBanner: () => {
    cleanupCallResources();
    set({
      callState: 'Idle',
      currentTarget: null,
      errorMessage: null,
      incomingOffer: null,
      connectedDurationSeconds: 0,
      audioLevelPercent: 0,
      rtpStats: { packetsSent: 0, packetsReceived: 0, bytesSent: 0, bytesReceived: 0 },
      iceStateLabel: 'Standby',
    });
  },
}));

function handleIncomingSignalingPacket(
  msg: Record<string, unknown>,
  set: (partial: Partial<CallingStoreState>) => void,
  get: () => CallingStoreState
) {
  if (!msg || typeof msg.type !== 'string') return;
  if (msg.fromPeerId === get().localPeerId) return;

  // Deduplicate packets across WebSocket and BroadcastChannel
  if (typeof msg.packetId === 'string') {
    if (seenPacketIds.has(msg.packetId)) return;
    seenPacketIds.add(msg.packetId);
  }

  if (msg.type === 'call:invite' && msg.sdpOffer) {
    if (get().callState === 'Connected') return;
    activeCallId = String(msg.callId || `call-${Date.now()}`);
    activeRemotePeerId = String(msg.fromPeerId);
    p2pIceQueue = createIceCandidateQueue<RTCIceCandidateInit>();
    set({
      callState: 'Ringing',
      currentTarget: {
        contactName: String(msg.callerName || 'Remote Browser Peer'),
        company: String(msg.company || 'WebRTC P2P Session'),
        phone: msg.phone ? String(msg.phone) : '+1 800 555 0100',
        callType: 'Incoming',
      },
      incomingOffer: {
        callId: activeCallId,
        fromPeerId: String(msg.fromPeerId),
        callerName: String(msg.callerName || 'Remote Browser Peer'),
        company: String(msg.company || 'WebRTC P2P Session'),
        phone: msg.phone ? String(msg.phone) : null,
        sdpOffer: msg.sdpOffer as RTCSessionDescriptionInit,
      },
      errorMessage: null,
      iceStateLabel: 'Incoming Peer Call Ringing...',
    });
    return;
  }

  if (msg.type === 'webrtc:answer' && msg.sdpAnswer && callerPc) {
    if (callerPc.signalingState !== 'have-local-offer') {
      return;
    }
    if (ringingTimeoutId) {
      clearTimeout(ringingTimeoutId);
      ringingTimeoutId = null;
    }
    activeRemotePeerId = String(msg.fromPeerId || '');
    callerPc
      .setRemoteDescription(new RTCSessionDescription(msg.sdpAnswer as RTCSessionDescriptionInit))
      .then(() => {
        if (!callerPc) return;
        const flushed = markRemoteDescriptionReady(p2pIceQueue);
        p2pIceQueue = flushed.nextState;
        for (const cand of flushed.candidatesToFlush) {
          callerPc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }

        // Start live bidirectional PCM audio stream relay to the remote peer
        if (localStream && activeCallId) {
          startLiveAudioStreamRelay(
            localStream,
            activeCallId,
            get().localPeerId,
            activeRemotePeerId || undefined
          );
        }

        if (!wasEverConnected) {
          wasEverConnected = true;
          set({
            callState: 'Connected',
            iceStateLabel: 'WebRTC Connected (P2P Audio)',
            connectedDurationSeconds: 0,
          });

          if (localStream) {
            attachAudioLevelMonitor(localStream, (pct) => {
              if (!get().isMuted && get().callState === 'Connected') {
                set({ audioLevelPercent: Math.max(18, pct) });
              } else {
                set({ audioLevelPercent: 0 });
              }
            });
          }

          if (durationIntervalId) clearInterval(durationIntervalId);
          durationIntervalId = setInterval(async () => {
            const stats = await pollPeerConnectionRtpStats(callerPc);
            set({
              connectedDurationSeconds: get().connectedDurationSeconds + 1,
              rtpStats: stats,
            });
          }, 1000);
        }
      })
      .catch((err) => {
        set({
          callState: 'Failed',
          errorMessage: err instanceof Error ? err.message : 'Failed to set remote SDP answer.',
        });
      });
    return;
  }

  if (msg.type === 'webrtc:audio-frame' && Array.isArray(msg.samples)) {
    const samples = msg.samples as number[];
    relayStats.packetsReceived += 1;
    relayStats.bytesReceived += samples.length * 4;
    if (!msg.muted) {
      playIncomingPcmFrame(samples);
    }
    set({
      rtpStats: { ...relayStats },
    });
    return;
  }

  if (msg.type === 'webrtc:ice-candidate' && msg.candidate) {
    const candidateInit = msg.candidate as RTCIceCandidateInit;
    const step = enqueueOrFlushCandidate(p2pIceQueue, candidateInit);
    p2pIceQueue = step.nextState;
    if (step.shouldApplyImmediately && callerPc) {
      callerPc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {});
    }
    return;
  }

  if (msg.type === 'call:reject') {
    cleanupCallResources();
    set({
      callState: 'Failed',
      errorMessage: 'Remote peer declined the incoming call.',
      iceStateLabel: 'Declined by Peer',
    });
    return;
  }

  if (msg.type === 'call:end') {
    if (get().callState === 'Connected' || get().callState === 'Ringing') {
      get().endCall();
    }
  }
}
