import { io } from 'socket.io-client';

const BACKEND_URL_STORAGE_KEY = 'devforge_backend_url';

export function getStoredBackendUrl() {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(BACKEND_URL_STORAGE_KEY);
  if (stored) return stored.trim();
  
  // Environment variable configured in Vercel / Vite
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl.trim();

  // If in localhost or development, default to port 3001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  return '';
}

export function saveBackendUrl(url) {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
  } else {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

class SyncService {
  constructor() {
    this.socket = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'disconnected'
    this.clientCount = 1;
    this.listeners = {
      status: new Set(),
      initState: new Set(),
      stateUpdated: new Set(),
      alertTriggered: new Set(),
      alertDismissed: new Set(),
      popupTriggered: new Set(),
      popupDismissed: new Set(),
    };
  }

  init() {
    const url = getStoredBackendUrl();
    if (!url) {
      console.log('[SyncService] No backend URL configured. Operating in local mode.');
      this.updateStatus('local-only');
      return;
    }

    this.connect(url);
  }

  connect(url) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const targetUrl = url || getStoredBackendUrl();
    if (!targetUrl) {
      this.updateStatus('local-only');
      return;
    }

    console.log('[SyncService] Connecting to backend:', targetUrl);
    this.updateStatus('connecting');

    try {
      this.socket = io(targetUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('[SyncService] Connected to backend! Socket ID:', this.socket.id);
        this.updateStatus('connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('[SyncService] Disconnected from backend:', reason);
        this.updateStatus('disconnected');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SyncService] Connection error:', err.message);
        this.updateStatus('disconnected');
      });

      this.socket.on('client_count', (count) => {
        this.clientCount = count;
        this.notifyStatusListeners();
      });

      this.socket.on('init_state', (remoteState) => {
        console.log('[SyncService] Received initial state from server:', remoteState);
        this.listeners.initState.forEach((cb) => cb(remoteState));
      });

      this.socket.on('state_updated', (remoteState) => {
        this.listeners.stateUpdated.forEach((cb) => cb(remoteState));
      });

      this.socket.on('alert_triggered', (alertData) => {
        this.listeners.alertTriggered.forEach((cb) => cb(alertData));
      });

      this.socket.on('alert_dismissed', (data) => {
        this.listeners.alertDismissed.forEach((cb) => cb(data));
      });

      this.socket.on('popup_triggered', (popupData) => {
        this.listeners.popupTriggered.forEach((cb) => cb(popupData));
      });

      this.socket.on('popup_dismissed', (data) => {
        this.listeners.popupDismissed.forEach((cb) => cb(data));
      });
    } catch (err) {
      console.error('[SyncService] Failed to initialize socket:', err);
      this.updateStatus('disconnected');
    }
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.notifyStatusListeners();
  }

  notifyStatusListeners() {
    this.listeners.status.forEach((cb) =>
      cb({
        status: this.status,
        clientCount: this.clientCount,
        backendUrl: getStoredBackendUrl(),
      })
    );
  }

  // Subscribe methods
  onStatusChange(cb) {
    this.listeners.status.add(cb);
    cb({
      status: this.status,
      clientCount: this.clientCount,
      backendUrl: getStoredBackendUrl(),
    });
    return () => this.listeners.status.delete(cb);
  }

  onInitState(cb) {
    this.listeners.initState.add(cb);
    return () => this.listeners.initState.delete(cb);
  }

  onStateUpdated(cb) {
    this.listeners.stateUpdated.add(cb);
    return () => this.listeners.stateUpdated.delete(cb);
  }

  onAlertTriggered(cb) {
    this.listeners.alertTriggered.add(cb);
    return () => this.listeners.alertTriggered.delete(cb);
  }

  onAlertDismissed(cb) {
    this.listeners.alertDismissed.add(cb);
    return () => this.listeners.alertDismissed.delete(cb);
  }

  onPopupTriggered(cb) {
    this.listeners.popupTriggered.add(cb);
    return () => this.listeners.popupTriggered.delete(cb);
  }

  onPopupDismissed(cb) {
    this.listeners.popupDismissed.add(cb);
    return () => this.listeners.popupDismissed.delete(cb);
  }

  // Outgoing actions
  sendSyncState(state) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sync_state', state);
    }
  }

  sendTriggerAlert(alertData, targetPanel = 'all') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('trigger_alert', { alertData, targetPanel });
    }
  }

  sendDismissAlert(targetPanel = 'all') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('dismiss_alert', { targetPanel });
    }
  }

  sendTriggerPopup(popupData, targetPanel = 'all') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('trigger_popup', { popupData, targetPanel });
    }
  }

  sendDismissPopup(targetPanel = 'all') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('dismiss_popup', { targetPanel });
    }
  }
}

export const syncService = new SyncService();
