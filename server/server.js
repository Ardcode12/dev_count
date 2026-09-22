import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

const DEFAULT_24H_MS = 24 * 60 * 60 * 1000;

const defaultState = {
  totalDurationMs: DEFAULT_24H_MS,
  remainingTimeMs: DEFAULT_24H_MS,
  isRunning: false,
  targetEndTime: null,
  activeAlert: null,
  activePopupImage: null,
  panelAlerts: {
    cc1: null,
    cc2: null,
    cc6: null,
    cc8: null,
  },
  panelPopups: {
    cc1: null,
    cc2: null,
    cc6: null,
    cc8: null,
  },
  soundEnabled: true,
  shotCount: 1,
  lastUpdated: Date.now(),
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data dir:', err.message);
  }
}

// Load persisted state if exists
let state = { ...defaultState };

try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    let remaining = parsed.remainingTimeMs ?? DEFAULT_24H_MS;
    let isRunning = parsed.isRunning ?? false;

    if (isRunning && parsed.targetEndTime) {
      const now = Date.now();
      remaining = Math.max(0, parsed.targetEndTime - now);
      if (remaining <= 0) {
        isRunning = false;
        remaining = 0;
      }
    }

    state = {
      ...defaultState,
      ...parsed,
      panelAlerts: {
        ...defaultState.panelAlerts,
        ...(parsed.panelAlerts || {}),
      },
      panelPopups: {
        ...defaultState.panelPopups,
        ...(parsed.panelPopups || {}),
      },
      remainingTimeMs: remaining,
      isRunning,
      targetEndTime: isRunning ? Date.now() + remaining : null,
    };
    console.log('[Server] Loaded persisted state from disk:', {
      remainingHours: (state.remainingTimeMs / 3600000).toFixed(2),
      isRunning: state.isRunning,
    });
  }
} catch (e) {
  console.warn('[Server] Error loading state file:', e.message);
}

function saveStateToDisk() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Server] Failed to write state to disk:', e.message);
  }
}

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Broadcast client count helper
function broadcastClientCount() {
  const count = io.engine.clientsCount;
  io.emit('client_count', count);
}

// Health check endpoint (for Render / Railway / Uptime monitors)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    connectedClients: io.engine.clientsCount,
    timerState: {
      isRunning: state.isRunning,
      remainingTimeMs: state.remainingTimeMs,
      targetEndTime: state.targetEndTime,
    },
    panels: ['cc1', 'cc2', 'cc6', 'cc8'],
  });
});

app.get('/api/state', (req, res) => {
  // If timer is running, calculate up-to-date remaining time
  let currentRemaining = state.remainingTimeMs;
  if (state.isRunning && state.targetEndTime) {
    currentRemaining = Math.max(0, state.targetEndTime - Date.now());
  }
  res.json({
    ...state,
    remainingTimeMs: currentRemaining,
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>DevForge Countdown Backend</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #161e2e; padding: 2rem; border-radius: 12px; border: 1px solid #374151; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #f59e0b; margin-top: 0; font-size: 1.5rem; }
        .badge { display: inline-block; background: #065f46; color: #34d399; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; margin-bottom: 1rem; }
        .stat { margin: 0.75rem 0; font-size: 0.95rem; color: #9ca3af; }
        .stat strong { color: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>DevForge Countdown Sync Server</h1>
        <div class="badge">&#9679; LIVE & RUNNING</div>
        <p class="stat">Connected Screens: <strong>${io.engine.clientsCount}</strong></p>
        <p class="stat">Timer Running: <strong>${state.isRunning ? 'YES' : 'NO'}</strong></p>
        <p class="stat">Supported Panels: <strong>CC1, CC2, CC6, CC8</strong></p>
        <p class="stat">Uptime: <strong>${Math.floor(process.uptime())}s</strong></p>
        <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #6b7280;">Ready for WebSocket connections from Vercel frontend.</p>
      </div>
    </body>
    </html>
  `);
});

// Socket.IO real-time event handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);
  
  // Calculate current real-time remaining if running
  let currentRemaining = state.remainingTimeMs;
  if (state.isRunning && state.targetEndTime) {
    currentRemaining = Math.max(0, state.targetEndTime - Date.now());
  }

  // Send initial full state and client count to newly connected client
  socket.emit('init_state', {
    ...state,
    remainingTimeMs: currentRemaining,
  });
  broadcastClientCount();

  // Full state sync from Master Admin (Timer controls)
  socket.on('sync_state', (payload) => {
    state = {
      ...state,
      ...payload,
      panelAlerts: state.panelAlerts, // keep panel alerts intact unless specified
      panelPopups: state.panelPopups, // keep panel popups intact unless specified
      lastUpdated: Date.now(),
    };
    saveStateToDisk();
    // Broadcast updated state to all connected clients
    socket.broadcast.emit('state_updated', state);
  });

  // Action: Alert Triggered (Global or Panel-targeted)
  socket.on('trigger_alert', (payload) => {
    const targetPanel = payload?.targetPanel || payload?.alertData?.targetPanel || 'all';
    const alertData = payload?.alertData || payload;
    const finalAlertData = { ...alertData, targetPanel };

    console.log(`[Socket] Alert triggered for [${targetPanel}]:`, finalAlertData?.title);

    if (targetPanel === 'all') {
      state.activeAlert = finalAlertData;
    } else if (state.panelAlerts && state.panelAlerts[targetPanel] !== undefined) {
      state.panelAlerts[targetPanel] = finalAlertData;
    } else {
      state.panelAlerts[targetPanel] = finalAlertData;
    }

    state.lastUpdated = Date.now();
    saveStateToDisk();
    io.emit('alert_triggered', finalAlertData);
    io.emit('state_updated', state);
  });

  // Action: Alert Dismissed
  socket.on('dismiss_alert', (payload) => {
    const targetPanel = (typeof payload === 'string' ? payload : payload?.targetPanel) || 'all';
    console.log(`[Socket] Alert dismissed for [${targetPanel}]`);

    if (targetPanel === 'all') {
      state.activeAlert = null;
    } else if (state.panelAlerts && state.panelAlerts[targetPanel] !== undefined) {
      state.panelAlerts[targetPanel] = null;
    }

    state.lastUpdated = Date.now();
    saveStateToDisk();
    io.emit('alert_dismissed', { targetPanel });
    io.emit('state_updated', state);
  });

  // Action: Popup Image Triggered (Meme stickers: Kaapi, Briyani, Naan Ready, etc.)
  socket.on('trigger_popup', (payload) => {
    const targetPanel = payload?.targetPanel || payload?.popupData?.targetPanel || 'all';
    const popupData = payload?.popupData || payload;
    const finalPopupData = { ...popupData, targetPanel };

    console.log(`[Socket] Popup sticker triggered for [${targetPanel}]:`, finalPopupData?.title);

    if (targetPanel === 'all') {
      state.activePopupImage = finalPopupData;
    } else if (state.panelPopups && state.panelPopups[targetPanel] !== undefined) {
      state.panelPopups[targetPanel] = finalPopupData;
    } else {
      state.panelPopups[targetPanel] = finalPopupData;
    }

    state.lastUpdated = Date.now();
    saveStateToDisk();
    io.emit('popup_triggered', finalPopupData);
    io.emit('state_updated', state);
  });

  // Action: Popup Dismissed
  socket.on('dismiss_popup', (payload) => {
    const targetPanel = (typeof payload === 'string' ? payload : payload?.targetPanel) || 'all';
    console.log(`[Socket] Popup sticker dismissed for [${targetPanel}]`);

    if (targetPanel === 'all') {
      state.activePopupImage = null;
    } else if (state.panelPopups && state.panelPopups[targetPanel] !== undefined) {
      state.panelPopups[targetPanel] = null;
    }

    state.lastUpdated = Date.now();
    saveStateToDisk();
    io.emit('popup_dismissed', { targetPanel });
    io.emit('state_updated', state);
  });

  // Disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    broadcastClientCount();
  });
});

httpServer.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(` DevForge Countdown Backend running on port ${PORT}`);
  console.log(` Health endpoint: http://localhost:${PORT}/health`);
  console.log(` WebSocket ready for Vercel clients`);
  console.log(`===========================================`);
});
