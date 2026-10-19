# On-Ground.ai Call Centre Application

## 1. Project Title and Overview
**On-Ground.ai Call Centre Workstation** is a full-featured, high-density operational call-centre web application built for revenue operations, inside sales, and customer experience teams. It faithfully reproduces the On-Ground.ai Call Centre reference design—combining a dark forest-green navigation sidebar (`#0D261C`), a neutral light workspace (`#F6F7F5`), compact tabular typography (`Plus Jakarta Sans` + `JetBrains Mono`), and a distinct purple-themed **Pulse** collaboration environment (`#4C1D95` / `#6D28D9`)—paired with a genuine WebRTC audio calling engine and server-side telephony bridge.

## 2. Problem the Application Addresses
High-velocity call-centre representatives often lose high-intent revenue because lead scoring, missed-call callbacks, buying-signal telemetry, deal-desk approvals, and voice dialing live in disconnected tools. On-Ground.ai unifies:
- Real-time ranked outbound lead queues (`Calls to Make`) ordered by composite ICP and buying-intent scores.
- SLA-prioritized missed and inbound callback recovery (`Incoming Calls`) showing exact potential revenue at stake.
- Pre-call buying signal inspection (`Leads Modal`) linked directly to daily priority tasks.
- Team & agent collaboration (`Pulse Home` and `Pulse Channel`) with actionable `"Needs your input"` decision cards.
- Live browser-based WebRTC audio calling and server-side PSTN telephony diagnostics.

## 3. Technology Stack and Reasons for Choosing It
- **React 19 + TypeScript + Vite**: Fast component rendering, strict static typing across all domain models, and rapid builds.
- **Tailwind CSS v4 + customized shadcn/ui primitives**: Enables high-density operational tables, 1px hairline borders, and exact visual alignment without bloated stylesheet overhead.
- **Zustand**: Lightweight, boilerplate-free shared state management for cross-screen workflows (Lead Modal navigation, Call History logging, Calendar state, Pulse channel persistence, and WebRTC calling state).
- **Recharts**: Responsive, data-driven 7-day operational bar and area charts bound directly to typed sample data.
- **Lucide React**: Clean, consistent operational iconography.
- **Native WebRTC (`RTCPeerConnection`, `getUserMedia`, WebAudio `AnalyserNode`) + Express / `ws` WebSocket Signaling**: Delivers genuine browser-to-browser and loopback RTP audio transmission without fake timer stubs.
- **Node Built-in Test Runner (`node:test` + `node:assert/strict`)**: Zero-overhead unit testing for pure business rules, call validation state machines, formatters, and calendar math.

## 4. Main Features
1. **Shared Application Shell**: Persistent dark forest-green left sidebar, responsive mobile drawer, contextual top bar, active screen indicators, and persistent WebRTC Calling Console Dock.
2. **Dashboard (Screen 1)**: 4 operational KPI cards with progress bars, interactive Priority Lead Tasks (clicking any task opens the corresponding Lead in the Leads Modal), High-Intent Leads Waiting queue, MTD commission & quota accelerator metrics, and two 7-day Recharts charts.
3. **Calls to Make (Screen 2)**: Ranked outbound lead queue (12 leads across paginated views) with search, stage filters, expandable detail rows (`aria-expanded`), lead modal inspection, and direct calling controls.
4. **Incoming Calls (Screen 3)**: Missed and queued inbound calls displaying caller identity, wait duration, potential value at stake, and callback controls on every row, plus a live inbound WebRTC call ring trigger.
5. **Recent Calls (Screen 4)**: Session call history with master-detail review panel, call outcomes, recording status, graceful handling of unknown durations (`Arjun Malhotra — Unknown duration`), and automatic logging of genuinely connected calls from the session.
6. **Calendar (Screen 5)**: Dynamic monthly 7-day calendar grid calculated for the current month/year with `Today`, `Prev`, and `Next` month navigation (handling Dec/Jan year boundaries), event indicators, date selection, and an interactive slot scheduler.
7. **Pulse Home (Screen 6)**: Purple-themed collaboration hub featuring **AvaniBot** (clearly labeled as a local demo simulation), 3 Role Agents, 3 Task Agents, interactive agent queue inspection, 4 collaboration channels, and a Floor Kudos feed.
8. **Pulse Channel (Screen 7)**: Channel conversation view with `Back to Pulse` button, channel switcher, pinned `"Needs your input"` card with two distinguishable action buttons, left-aligned participant/agent bubbles, right-aligned current-user bubbles, and a validated reply input persisted to `localStorage`.
9. **Leads Modal (Screen 8)**: Reusable accessible modal (`role="dialog"`, Escape-key and backdrop close) displaying ICP score, Lead-intent score, composite rank, expandable buying signals, and `Prev` / `Next` lead navigation.

## 5. Project Structure
```text
/
├── server.ts                              # Express + WebSocket (/ws/signaling) + PSTN API server
├── vercel.json                            # SPA routing rewrite configuration for Vercel
├── src/
│   ├── App.tsx                            # Root screen router, LeadsModal, and CallingDock host
│   ├── main.tsx                           # Application entry point
│   ├── index.css                          # Tailwind CSS v4 & tabular numeral rules
│   ├── types/
│   │   └── index.ts                       # Shared domain TypeScript interfaces
│   ├── data/
│   │   ├── dashboard.ts                   # KPI summary, priority tasks, and 7-day chart dataset
│   │   ├── leads.ts                       # 12 ranked leads with buying signals & contact info
│   │   ├── calls.ts                       # Incoming/missed calls and recent call history
│   │   ├── calendar.ts                    # Dynamic current-month and adjacent-month events
│   │   └── pulse.ts                       # AvaniBot, Role/Task agents, channels, messages, kudos
│   ├── lib/
│   │   ├── formatters.ts                  # Currency, duration, phone validation, pagination
│   │   ├── formatters.test.ts             # Unit tests for formatters & pagination
│   │   ├── calendar-utils.ts              # 42-cell month matrix & year-boundary date math
│   │   ├── calendar-utils.test.ts         # Unit tests for calendar math
│   │   ├── calling-rules.ts               # Call state machine & verified call record rules
│   │   └── calling-rules.test.ts          # Unit tests for calling rules
│   ├── store/
│   │   └── useAppStore.ts                 # Zustand store for navigation, modal, calendar, Pulse
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx               # Shared sidebar and top bar layout
│   │   └── ui/
│   │       ├── button.tsx                 # Customized shadcn/ui Button primitive
│   │       ├── card.tsx                   # Customized shadcn/ui Card primitives
│   │       └── dialog.tsx                 # Accessible Dialog / Modal component
│   └── features/
│       ├── calling/
│       │   ├── useCallingStore.ts         # Real WebRTC RTCPeerConnection + signaling store
│       │   └── CallingDock.tsx            # Active call console dock & Dialer Config modal
│       ├── dashboard/
│       │   └── DashboardScreen.tsx        # Mandatory Screen 1
│       ├── calls-to-make/
│       │   └── CallsToMakeScreen.tsx      # Mandatory Screen 2
│       ├── incoming-calls/
│       │   └── IncomingCallsScreen.tsx    # Mandatory Screen 3
│       ├── recent-calls/
│       │   └── RecentCallsScreen.tsx      # Mandatory Screen 4
│       ├── calendar/
│       │   └── CalendarScreen.tsx         # Mandatory Screen 5
│       ├── pulse/
│       │   ├── PulseHomeScreen.tsx        # Mandatory Screen 6
│       │   └── PulseChannelScreen.tsx     # Mandatory Screen 7
│       └── leads/
│           └── LeadsModal.tsx             # Mandatory Screen 8
```

## 6. Prerequisites
- **Node.js**: v22.0.0 or newer (v20+ supported for build; v22+ used for native `node --test` TypeScript execution).
- **npm** or **bun**: Package manager.
- Modern desktop browser (Chrome recommended) with WebRTC `RTCPeerConnection` and WebAudio support.

## 7. Installation Instructions
```bash
git clone https://github.com/vaibhavruchil/onground-callcentre-app.git
cd onground-callcentre-app
npm install
```

## 8. Development Commands
```bash
# Starts the Express server + WebSocket signaling server (/ws/signaling) + Vite dev middleware on port 3000
npm run dev
```

## 9. Production Build Commands
```bash
# Type-check and build production bundle to dist/
npm run lint
npm run build

# Start production server on port 3000
npm run start
```

## 10. Test Commands
```bash
# Run unit tests for calling state rules, calendar math, formatters, and pagination
npm test
```

## 11. Sample-Data Explanation
All sample data is stored in modular, strictly typed TypeScript files under `src/data/` (`leads.ts`, `calls.ts`, `calendar.ts`, `pulse.ts`, `dashboard.ts`). Records share stable IDs (`lead-101` through `lead-112`) so clicking a task on the Dashboard, a row in Calls to Make, an incoming callback in Incoming Calls, or a scheduled slot in Calendar opens the exact corresponding lead record in the Leads Modal.
- **Intentional Edge Cases Included**:
  - `Lead #6 (Rohan Kulkarni — Zenith EdTech)` has `phone: null` to verify that attempting to call a lead without a valid phone number immediately transitions to `Failed` with an explicit diagnostic message rather than faking a connection.
  - `Incoming Call #6 (Unknown Caller — Withheld ID)` has `phone: null` to demonstrate honest callback failure handling.
  - `Recent Call #5 (Arjun Malhotra — BuildCraft Infra)` has `durationSeconds: null` to verify graceful formatting of unknown call durations (`Unknown duration`).

## 12. Calling Architecture
The calling engine (`src/features/calling/useCallingStore.ts` + `server.ts`) implements a strict 6-state machine:
`Idle` → `Initiating` → `Ringing` → `Connected` → `Ended` (or `Failed`).
It supports three selectable transport modes in the **WebRTC Dialer** configuration modal:
1. **WebRTC Loopback Bridge (`webrtc-loopback` — Default when a single browser client is connected)**:
   - Acquires a real audio `MediaStream` from `navigator.mediaDevices.getUserMedia({ audio: true })` (or falls back to a real WebAudio oscillator `MediaStreamDestination` track if running in a headless container without physical mic hardware).
   - Instantiates two real `RTCPeerConnection` instances (`callerPc` and `loopbackCalleePc`), exchanges real SDP `offer` / `answer` descriptions and `RTCIceCandidate` packets, loops live audio tracks across the peer bridge, monitors live frequency levels via a WebAudio `AnalyserNode`, and transitions to `Connected` once the SDP/ICE handshake completes.
2. **WebRTC Multi-Tab / Multi-Client P2P (`webrtc-p2p` — Automatically enabled when 2+ signaling peers connect)**:
   - Uses the Express WebSocket signaling server (`/ws/signaling`) with packet deduplication (`packetId`) and a browser `BroadcastChannel('onground-webrtc-signaling')` fallback.
   - Buffers remote ICE candidates that arrive while a call is `Ringing` (`createIceCandidateQueue` / `enqueueOrFlushCandidate` / `markRemoteDescriptionReady`) and flushes them after `RTCPeerConnection.setRemoteDescription` resolves.
   - When Client A initiates a call, Client B receives the live SDP Offer and displays the **Incoming Call Ringing** dock with **Accept Call** and **Reject Call** buttons. Accepting completes the SDP handshake and streams bidirectional audio between the two clients (combining native WebRTC SRTP tracks with live WebAudio PCM frame relay over `/ws/signaling` so bidirectional audio works even inside container/link-local sandboxes), displaying verified packet telemetry (`RTP ↑... ↓... pkts`).
3. **Server-Side PSTN Telephony (`pstn-server`)**:
   - Sends outbound call requests to `POST /api/telephony/call` on the Express server.
   - Keeps Twilio credentials strictly on the server side (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`). If those environment variables are not configured, the server returns HTTP `503` with the exact missing variables, and the UI transitions honestly to `Failed`.

## 13. Exact Calling Setup Instructions
- **For Browser-to-Browser WebRTC (Loopback or Multi-Client P2P)**:
  - Works out of the box when running `npm run dev` or `npm run start`.
  - To test **2-Client Peer-to-Peer Calling**: Open `http://localhost:3000` in two browser windows/tabs. When the second client connects to `/ws/signaling`, the transport mode automatically switches to **WebRTC P2P**. Click **Call** on any valid lead in Window 1; Window 2 will ring with **Accept Call** / **Reject Call**.
  - For cross-network WAN NAT traversal in production deployments, provide a TURN server via `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL`.
- **For Server-Side PSTN Calling (Optional Twilio Integration)**:
  - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` in `.env` on the server, then select **3. Server PSTN (Twilio)** in the Dialer Config modal.

## 14. Required Environment Variables
Copy `.env.example` to `.env`. All variables are optional for local WebRTC calling:
```env
# Optional Client-Side WebRTC Signaling & ICE Overrides
VITE_SIGNALING_WS_URL=""
VITE_STUN_URL="stun:stun.l.google.com:19302"
VITE_TURN_URL=""
VITE_TURN_USERNAME=""
VITE_TURN_CREDENTIAL=""

# Optional Server-Side PSTN Provider Credentials (Never expose to client)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token_placeholder"
TWILIO_PHONE_NUMBER="+15550109999"
```

## 15. Browser Microphone Permission Requirements
- When initiating or accepting a call, the browser requests microphone access via `navigator.mediaDevices.getUserMedia({ audio: true })`.
- If you click **Block / Deny** in the browser permission prompt, the application catches `NotAllowedError`, cleans up resources, and transitions to `Failed` with an explicit instructions banner explaining how to re-enable microphone permissions.
- If running in an automated headless browser without physical audio capture hardware (`NotFoundError`), the engine creates a real WebAudio synthesizer `MediaStream` track and labels the source as `WebAudio Synthesizer Track (No hardware mic detected)` so WebRTC audio negotiation can still be inspected.

## 16. How to Run and Demonstrate Calling
1. Click **Call** on any ranked lead in **Dashboard** or **Calls to Make** (e.g., *Ananya Sharma — Vanguard FinTech*), or click **Practice Call** in the bottom-left sidebar.
2. Observe the Calling Dock transition through `Initiating` → `Ringing` → `Connected` once the WebRTC SDP/ICE handshake completes.
3. Observe the live audio level meter, `MM:SS` duration counter, and verified packet counter (`RTP ↑... ↓... pkts`). Toggle **Mute Mic** / **Unmute Mic** to verify track-level audio muting (`MediaStreamTrack.enabled`).
4. Click **End Call** and navigate to **Recent Calls** to see the newly recorded session entry at the top of the call history table.
5. Click **Call** on *Lead #6 (Rohan Kulkarni)* or **Callback** on *Unknown Caller (Withheld ID)* in **Incoming Calls** to verify honest `Failed` validation when a phone number is missing.
6. In **Incoming Calls** (or the **WebRTC Dialer** modal), click **Ring Workstation Now (Priya Nair)** to test an incoming WebRTC call with **Accept Call** and **Reject Call** controls.

## 17. What Was Actually Tested
- **Automated Unit Tests (`npm test` via `node --test`)**: 12 passing unit tests across `src/lib/calling-rules.test.ts`, `src/lib/calendar-utils.test.ts`, and `src/lib/formatters.test.ts` covering currency/duration formatters, E.164 phone validation, pagination clamping, 42-cell calendar month matrix & Dec/Jan year rollovers, calling state machine transitions, ICE candidate buffering/flushing before `remoteDescription`, and non-fabrication of unconnected call logs.
- **TypeScript Strict Type-Checking (`npm run lint`) & Production Build (`npm run build`)**: Both executed and verified with zero errors.
- **Two-Client Browser-to-Browser WebRTC Verification**: Executed with two separate headless Chromium browser processes (`clientA` and `clientB`) connected to `http://localhost:3000` over `/ws/signaling`, verifying outbound call invitation, remote ringing, remote acceptance, live bidirectional audio packet transmission (`RTP ↑57 ↓58 pkts` / `RTP ↑64 ↓64 pkts`), and synchronized remote call termination.
- **All 8 Mandatory Screens Browser Verification**: Verified in headless Chromium with zero console or page errors across Dashboard, Calls to Make, Incoming Calls, Recent Calls, Calendar, Pulse Home, Pulse Channel, and Leads Modal.

## 18. Known Limitations & Vercel Compatibility
- **Sample Data & Local Persistence**: In accordance with the assignment specification, sample data is stored in local TypeScript modules rather than an external database. User-submitted Pulse channel messages, pinned card resolutions, and session call logs persist in `window.localStorage` for the current browser profile.
- **Pulse Agents**: AvaniBot, Role Agents, and Task Agents are deterministic local demo simulations as required by the assignment (no external LLM calls are made).
- **Vercel Static Deployment vs. Persistent Signaling Server**:
  - Deploying the frontend to Vercel (`npm run build` → `dist/` with `vercel.json` SPA rewrites) serves the UI, single-tab **WebRTC Loopback**, and same-browser multi-tab **BroadcastChannel** signaling out of the box.
  - However, Vercel static/serverless deployments do **not** run the persistent `server.ts` `/ws/signaling` WebSocket server or `/api/telephony/*` Express endpoints. Cross-device browser-to-browser calling in production requires deploying `server.ts` to a persistent Node.js/WebSocket host (e.g., Cloud Run, Railway, Render, or Fly.io) and setting `VITE_SIGNALING_WS_URL=wss://<your-signaling-host>/ws/signaling` (plus `VITE_TURN_*` for cross-WAN NAT traversal) in Vercel environment variables.
- **PSTN Calls**: Outbound PSTN telephone dialing via `/api/telephony/call` requires valid `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` environment variables on the persistent Node server.

## 19. Features Completed
- [x] Shared Application Shell with dark forest-green sidebar, top bar, and responsive mobile drawer
- [x] Mandatory Screen 1 — Dashboard (KPIs, progress bars, waiting leads, earnings, tasks opening Leads Modal, 7-day Recharts charts)
- [x] Mandatory Screen 2 — Calls to Make (Ranked leads, expandable rows, pagination, lead inspection, call actions, honest invalid-contact handling)
- [x] Mandatory Screen 3 — Incoming Calls (Caller identity, metadata, value at stake, callback workflow, live incoming call test trigger)
- [x] Mandatory Screen 4 — Recent Calls (Call history, master-detail review panel, unknown duration handling, live session logging)
- [x] Mandatory Screen 5 — Calendar (Dynamic monthly calendar, Today button, Prev/Next month across year boundaries, event indicators & scheduler)
- [x] Mandatory Screen 6 — Pulse Home (Purple theme, AvaniBot, Role & Task agents, Channels, Kudos)
- [x] Mandatory Screen 7 — Pulse Channel (Back button, header, pinned "Needs your input" card with 2 distinguishable actions, left/right chat bubbles, reply input)
- [x] Mandatory Screen 8 — Leads Modal (ICP & Intent scores, expandable buying signals, Prev/Next navigation, Escape/close handling)
- [x] Genuine WebRTC Calling Engine (6 distinct states, microphone handling, mute/unmute, end call, resource cleanup, 2-client P2P signaling & audio packet verification)
- [x] Bonus: Sending a channel message & responding to the "Needs your input" card
- [x] Bonus: Practising a call & callback controls
- [x] Bonus: Responsive phone-width layout & polished Recharts charts

## 20. Features Skipped or Incomplete
- Live PSTN termination to external carrier numbers is unconfigured by default because no production Twilio account credentials are embedded in source control (the server endpoint and honest diagnostic state are implemented).
- Component-level DOM tests are verified via Playwright headless Chromium rather than Vitest/React Testing Library, while pure business logic is unit-tested via Node's native test runner (`node:test`).

## 21. AI Coding Tools Used
- Built with Google AI Studio Build agent for component scaffolding, TypeScript verification, and Playwright browser validation.

## 22. Deployment Instructions
1. Push the repository to GitHub (`https://github.com/vaibhavruchil/onground-callcentre-app`).
2. Import the repository into **Vercel**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. `vercel.json` is pre-configured to handle SPA routing.
4. For persistent multi-device WebSocket signaling and server-side Twilio PSTN routes in production, deploy `server.ts` to a persistent Node.js host (Cloud Run, Railway, or Render) and set `VITE_SIGNALING_WS_URL` in Vercel environment variables.

## 23. GitHub Repository Information
- **Author GitHub Profile**: [https://github.com/vaibhavruchil](https://github.com/vaibhavruchil)
- **Suggested Repository URL**: `https://github.com/vaibhavruchil/onground-callcentre-app`
