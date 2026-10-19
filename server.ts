import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SignalingClient {
  ws: WebSocket;
  peerId: string;
  role: 'agent' | 'contact';
  name: string;
  joinedAt: string;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  const clients = new Map<string, SignalingClient>();

  const wss = new WebSocketServer({ server, path: '/ws/signaling' });

  function broadcastPeersList() {
    const peerList = Array.from(clients.values()).map((c) => ({
      peerId: c.peerId,
      role: c.role,
      name: c.name,
      joinedAt: c.joinedAt,
    }));
    const payload = JSON.stringify({
      type: 'peers:list',
      peers: peerList,
    });
    for (const client of clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  wss.on('connection', (ws) => {
    let registeredPeerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'peer:register' && msg.peerId) {
          registeredPeerId = String(msg.peerId);
          clients.set(registeredPeerId, {
            ws,
            peerId: registeredPeerId,
            role: msg.role === 'contact' ? 'contact' : 'agent',
            name: msg.name || registeredPeerId,
            joinedAt: new Date().toISOString(),
          });
          broadcastPeersList();
          return;
        }

        // Relay signaling packets to targetPeerId or broadcast to all other peers
        const targetPeerId = msg.targetPeerId;
        if (targetPeerId && clients.has(targetPeerId)) {
          const dest = clients.get(targetPeerId)!;
          if (dest.ws.readyState === WebSocket.OPEN) {
            dest.ws.send(JSON.stringify(msg));
          }
        } else {
          for (const [id, client] of clients.entries()) {
            if (id !== registeredPeerId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify(msg));
            }
          }
        }
      } catch (err) {
        console.error('Signaling message parse error:', err);
      }
    });

    ws.on('close', () => {
      if (registeredPeerId && clients.has(registeredPeerId)) {
        clients.delete(registeredPeerId);
        broadcastPeersList();
      }
    });
  });

  // Server-side telephony diagnostic & PSTN bridge status
  app.get('/api/telephony/status', (_req, res) => {
    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missingEnvVars = requiredVars.filter((key) => !process.env[key] || process.env[key]?.trim() === '');

    res.json({
      websocketSignaling: true,
      signalingPath: '/ws/signaling',
      connectedPeersCount: clients.size,
      connectedPeers: Array.from(clients.values()).map((c) => ({
        peerId: c.peerId,
        role: c.role,
        name: c.name,
      })),
      pstnProvider: 'twilio',
      pstnConfigured: missingEnvVars.length === 0,
      missingEnvVars,
    });
  });

  // Server-side PSTN outbound call initiation (never exposes credentials to frontend)
  app.post('/api/telephony/call', async (req, res) => {
    const { toPhone, leadName } = req.body || {};
    if (!toPhone || typeof toPhone !== 'string' || !/^\+?[1-9]\d{6,14}$/.test(toPhone.replace(/[\s()-]/g, ''))) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_DESTINATION',
        message: 'Destination phone number is missing or invalid E.164 format.',
      });
      return;
    }

    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

    if (!sid || !token || !fromPhone) {
      const missing = [
        !sid ? 'TWILIO_ACCOUNT_SID' : null,
        !token ? 'TWILIO_AUTH_TOKEN' : null,
        !fromPhone ? 'TWILIO_PHONE_NUMBER' : null,
      ].filter(Boolean);
      res.status(503).json({
        ok: false,
        errorCode: 'PSTN_CREDENTIALS_MISSING',
        message: `PSTN telephony is not configured on the server. Missing environment variables: ${missing.join(', ')}. Use WebRTC Browser-to-Browser or WebRTC Loopback mode for live audio calling.`,
        missingEnvVars: missing,
      });
      return;
    }

    try {
      const normalizedTo = toPhone.replace(/[\s()-]/g, '');
      const params = new URLSearchParams();
      params.append('To', normalizedTo);
      params.append('From', fromPhone);
      params.append(
        'Twiml',
        `<Response><Say voice="alice">Connecting On-Ground call centre representative to ${leadName || 'contact'}.</Say><Dial>${normalizedTo}</Dial></Response>`
      );

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        res.status(response.status).json({
          ok: false,
          errorCode: 'PROVIDER_REJECTED',
          message: data.message || 'Twilio rejected the outbound call request.',
        });
        return;
      }

      res.json({
        ok: true,
        callSid: data.sid,
        status: data.status,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        errorCode: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reach PSTN telephony provider.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`On-Ground.ai Call Centre Server running on http://localhost:${PORT}`);
  });
}

startServer();
