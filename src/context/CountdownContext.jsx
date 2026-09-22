import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { playClapperSound, playKollywoodFanfare, playCinemaWhistle, playClickSound } from '../utils/audio';
import { syncService, getStoredBackendUrl, saveBackendUrl } from '../services/syncService';

const STORAGE_KEY = 'devforge_countdown_state_v3';
const CHANNEL_NAME = 'devforge_countdown_sync_channel';
const DEFAULT_24H_MS = 24 * 60 * 60 * 1000;

export const BUTTON_IMAGES = [
  {
    id: 'kaapi',
    title: 'Kaapi Break',
    subtitle: 'When the mind needs rebooting... Kaapi...!!!',
    image: '/images/buttons/dfabbb15-05b5-4b29-bc87-9edaf66ee0fa.jpeg',
    tag: 'Refreshment',
  },
  {
    id: 'briyani',
    title: 'Briyani Time',
    subtitle: 'Kaithi bucket briyani feast is ready! Fuel up!',
    image: '/images/buttons/b60ec907-c75d-4d53-9d9c-8b445304ed5b.jpeg',
    tag: 'Lunch',
  },
  {
    id: 'naan-ready',
    title: 'Naan Ready',
    subtitle: 'Nan Ready Dhan Varava! Full mass energy!',
    image: '/images/buttons/0454845b-eff4-41d0-bfe3-8ad61c91c093.jpeg',
    tag: 'Sprint / Action',
  },
  {
    id: 'chelloo',
    title: 'Hai Chelloo',
    subtitle: 'Hai Chelloo!! Mentors checking your progress!',
    image: '/images/buttons/0153e9d1-ec30-4f88-8d12-275df0f78a6f.jpeg',
    tag: 'Review',
  },
  {
    id: 'thoonguu',
    title: 'Power Nap',
    subtitle: 'When life hurts ... Thoonguu!',
    image: '/images/buttons/d582c238-edb3-4baf-8c47-4aad82c54f02.jpeg',
    tag: 'Rest Break',
  },
  {
    id: 'shock-aayiten',
    title: 'Shock Aayiten',
    subtitle: 'Naan Apadiye Shock Aayiten!',
    image: '/images/buttons/c7b029f2-fe49-4052-8d70-d6de872ce4c1.jpeg',
    tag: 'Alert',
  },
  {
    id: 'meiyazhagan',
    title: 'Team Vibe',
    subtitle: 'Meiyazhagan pair programming squad goals!',
    image: '/images/buttons/4860e463-3e64-4398-81a6-6bf22cae2c63.jpeg',
    tag: 'Squad',
  },
  {
    id: 'love-today',
    title: 'Shock Reaction',
    subtitle: 'When the demo throws an unexpected bug!',
    image: '/images/buttons/44950940-bab3-490e-a102-260f0774fe2a.jpeg',
    tag: 'Review Alert',
  },
];

const CountdownContext = createContext(null);

export function CountdownProvider({ children }) {
  const [timerState, setTimerState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
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

        return {
          totalDurationMs: parsed.totalDurationMs || DEFAULT_24H_MS,
          remainingTimeMs: remaining,
          isRunning,
          targetEndTime: isRunning ? Date.now() + remaining : null,
          activeAlert: parsed.activeAlert || null,
          activePopupImage: parsed.activePopupImage || null,
          panelAlerts: parsed.panelAlerts || { cc1: null, cc2: null, cc6: null, cc8: null },
          panelPopups: parsed.panelPopups || { cc1: null, cc2: null, cc6: null, cc8: null },
          soundEnabled: parsed.soundEnabled ?? true,
          shotCount: parsed.shotCount || 1,
        };
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return {
      totalDurationMs: DEFAULT_24H_MS,
      remainingTimeMs: DEFAULT_24H_MS,
      isRunning: false,
      targetEndTime: null,
      activeAlert: null,
      activePopupImage: null,
      panelAlerts: { cc1: null, cc2: null, cc6: null, cc8: null },
      panelPopups: { cc1: null, cc2: null, cc6: null, cc8: null },
      soundEnabled: true,
      shotCount: 1,
    };
  });

  const [syncStatus, setSyncStatus] = useState('connecting');
  const [connectedClients, setConnectedClients] = useState(1);
  const [backendUrl, setBackendUrl] = useState(getStoredBackendUrl());

  const channelRef = useRef(null);

  const persistState = useCallback((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, []);

  const broadcastLocal = useCallback((action) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(action);
      } catch (e) {
        console.warn('Error broadcasting message:', e);
      }
    }
  }, []);

  // Configure custom backend URL
  const configureBackend = useCallback((url) => {
    saveBackendUrl(url);
    setBackendUrl(url);
    syncService.connect(url);
  }, []);

  // Initialize syncService and BroadcastChannel
  useEffect(() => {
    syncService.init();

    const unsubStatus = syncService.onStatusChange(({ status, clientCount, backendUrl: currentUrl }) => {
      setSyncStatus(status);
      setConnectedClients(clientCount);
      setBackendUrl(currentUrl);
    });

    const mergeRemoteState = (remote) => {
      if (!remote) return;
      setTimerState((prev) => {
        let remaining = remote.remainingTimeMs ?? prev.remainingTimeMs;
        let isRunning = remote.isRunning ?? false;

        if (isRunning && remote.targetEndTime) {
          const now = Date.now();
          remaining = Math.max(0, remote.targetEndTime - now);
          if (remaining <= 0) {
            isRunning = false;
            remaining = 0;
          }
        }

        const merged = {
          ...prev,
          ...remote,
          panelAlerts: {
            ...(prev.panelAlerts || { cc1: null, cc2: null, cc6: null, cc8: null }),
            ...(remote.panelAlerts || {}),
          },
          panelPopups: {
            ...(prev.panelPopups || { cc1: null, cc2: null, cc6: null, cc8: null }),
            ...(remote.panelPopups || {}),
          },
          remainingTimeMs: remaining,
          isRunning,
          targetEndTime: isRunning ? (remote.targetEndTime || Date.now() + remaining) : null,
        };
        persistState(merged);
        return merged;
      });
    };

    const unsubInit = syncService.onInitState(mergeRemoteState);
    const unsubUpdated = syncService.onStateUpdated(mergeRemoteState);

    const unsubAlert = syncService.onAlertTriggered((alertData) => {
      const target = alertData?.targetPanel || 'all';
      setTimerState((prev) => {
        let next;
        if (target === 'all') {
          next = { ...prev, activeAlert: alertData };
        } else {
          next = {
            ...prev,
            panelAlerts: {
              ...(prev.panelAlerts || {}),
              [target]: alertData,
            },
          };
        }
        persistState(next);
        return next;
      });
      if (timerState.soundEnabled) {
        playKollywoodFanfare();
      }
    });

    const unsubAlertDismiss = syncService.onAlertDismissed((data) => {
      const target = data?.targetPanel || 'all';
      setTimerState((prev) => {
        let next;
        if (target === 'all') {
          next = { ...prev, activeAlert: null };
        } else {
          next = {
            ...prev,
            panelAlerts: {
              ...(prev.panelAlerts || {}),
              [target]: null,
            },
          };
        }
        persistState(next);
        return next;
      });
    });

    const unsubPopup = syncService.onPopupTriggered((popupData) => {
      const target = popupData?.targetPanel || 'all';
      setTimerState((prev) => {
        let next;
        if (target === 'all') {
          next = { ...prev, activePopupImage: popupData };
        } else {
          next = {
            ...prev,
            panelPopups: {
              ...(prev.panelPopups || {}),
              [target]: popupData,
            },
          };
        }
        persistState(next);
        return next;
      });
      if (timerState.soundEnabled) {
        playCinemaWhistle();
      }
    });

    const unsubPopupDismiss = syncService.onPopupDismissed((data) => {
      const target = data?.targetPanel || 'all';
      setTimerState((prev) => {
        let next;
        if (target === 'all') {
          next = { ...prev, activePopupImage: null };
        } else {
          next = {
            ...prev,
            panelPopups: {
              ...(prev.panelPopups || {}),
              [target]: null,
            },
          };
        }
        persistState(next);
        return next;
      });
    });

    // Local BroadcastChannel for same-device fallback
    let bc = null;
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = bc;

      bc.onmessage = (event) => {
        const action = event.data;
        if (!action || !action.type) return;

        if (action.type === 'SYNC_STATE') {
          setTimerState((prev) => ({
            ...prev,
            ...action.payload,
          }));
        } else if (action.type === 'TRIGGER_ALERT') {
          const target = action.payload?.targetPanel || 'all';
          setTimerState((prev) => {
            const next = target === 'all'
              ? { ...prev, activeAlert: action.payload }
              : { ...prev, panelAlerts: { ...(prev.panelAlerts || {}), [target]: action.payload } };
            persistState(next);
            return next;
          });
          if (timerState.soundEnabled) {
            playKollywoodFanfare();
          }
        } else if (action.type === 'DISMISS_ALERT') {
          const target = action.payload?.targetPanel || 'all';
          setTimerState((prev) => {
            const next = target === 'all'
              ? { ...prev, activeAlert: null }
              : { ...prev, panelAlerts: { ...(prev.panelAlerts || {}), [target]: null } };
            persistState(next);
            return next;
          });
        } else if (action.type === 'TRIGGER_POPUP_IMAGE') {
          const target = action.payload?.targetPanel || 'all';
          setTimerState((prev) => {
            const next = target === 'all'
              ? { ...prev, activePopupImage: action.payload }
              : { ...prev, panelPopups: { ...(prev.panelPopups || {}), [target]: action.payload } };
            persistState(next);
            return next;
          });
          if (timerState.soundEnabled) {
            playCinemaWhistle();
          }
        } else if (action.type === 'DISMISS_POPUP_IMAGE') {
          const target = action.payload?.targetPanel || 'all';
          setTimerState((prev) => {
            const next = target === 'all'
              ? { ...prev, activePopupImage: null }
              : { ...prev, panelPopups: { ...(prev.panelPopups || {}), [target]: null } };
            persistState(next);
            return next;
          });
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          let remaining = parsed.remainingTimeMs;
          if (parsed.isRunning && parsed.targetEndTime) {
            remaining = Math.max(0, parsed.targetEndTime - Date.now());
          }
          setTimerState((prev) => ({
            ...prev,
            ...parsed,
            remainingTimeMs: remaining,
          }));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubStatus();
      unsubInit();
      unsubUpdated();
      unsubAlert();
      unsubAlertDismiss();
      unsubPopup();
      unsubPopupDismiss();
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [persistState, timerState.soundEnabled]);

  // Main countdown loop: update time every 100ms when isRunning is true
  useEffect(() => {
    if (!timerState.isRunning || !timerState.targetEndTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, timerState.targetEndTime - now);

      if (timeLeft <= 0) {
        setTimerState((prev) => {
          const next = {
            ...prev,
            isRunning: false,
            remainingTimeMs: 0,
            targetEndTime: null,
          };
          persistState(next);
          broadcastLocal({ type: 'SYNC_STATE', payload: next });
          syncService.sendSyncState(next);
          return next;
        });
        clearInterval(interval);
      } else {
        setTimerState((prev) => ({
          ...prev,
          remainingTimeMs: timeLeft,
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.targetEndTime, persistState, broadcastLocal]);

  // Timer Actions
  const startTimer = useCallback(() => {
    playClapperSound();
    setTimerState((prev) => {
      const targetEndTime = Date.now() + prev.remainingTimeMs;
      const next = {
        ...prev,
        isRunning: true,
        targetEndTime,
        shotCount: prev.shotCount + 1,
      };
      persistState(next);
      broadcastLocal({ type: 'SYNC_STATE', payload: next });
      syncService.sendSyncState(next);
      return next;
    });
  }, [persistState, broadcastLocal]);

  const pauseTimer = useCallback(() => {
    playClickSound();
    setTimerState((prev) => {
      let currentRemaining = prev.remainingTimeMs;
      if (prev.isRunning && prev.targetEndTime) {
        currentRemaining = Math.max(0, prev.targetEndTime - Date.now());
      }
      const next = {
        ...prev,
        isRunning: false,
        remainingTimeMs: currentRemaining,
        targetEndTime: null,
      };
      persistState(next);
      broadcastLocal({ type: 'SYNC_STATE', payload: next });
      syncService.sendSyncState(next);
      return next;
    });
  }, [persistState, broadcastLocal]);

  const resetTimer = useCallback((customDurationMs = DEFAULT_24H_MS) => {
    playClapperSound();
    setTimerState((prev) => {
      const next = {
        ...prev,
        totalDurationMs: customDurationMs,
        remainingTimeMs: customDurationMs,
        isRunning: false,
        targetEndTime: null,
      };
      persistState(next);
      broadcastLocal({ type: 'SYNC_STATE', payload: next });
      syncService.sendSyncState(next);
      return next;
    });
  }, [persistState, broadcastLocal]);

  const adjustTime = useCallback((deltaMs) => {
    playClickSound();
    setTimerState((prev) => {
      let newRemaining = prev.remainingTimeMs + deltaMs;
      newRemaining = Math.max(0, newRemaining);
      const newTotal = Math.max(prev.totalDurationMs, newRemaining);
      const newTarget = prev.isRunning ? Date.now() + newRemaining : null;

      const next = {
        ...prev,
        remainingTimeMs: newRemaining,
        totalDurationMs: newTotal,
        targetEndTime: newTarget,
      };
      persistState(next);
      broadcastLocal({ type: 'SYNC_STATE', payload: next });
      syncService.sendSyncState(next);
      return next;
    });
  }, [persistState, broadcastLocal]);

  const setExactTime = useCallback((hours, minutes, seconds) => {
    playClickSound();
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    setTimerState((prev) => {
      const next = {
        ...prev,
        totalDurationMs: totalMs,
        remainingTimeMs: totalMs,
        isRunning: false,
        targetEndTime: null,
      };
      persistState(next);
      broadcastLocal({ type: 'SYNC_STATE', payload: next });
      syncService.sendSyncState(next);
      return next;
    });
  }, [persistState, broadcastLocal]);

  const getAlertForPanel = useCallback((panelId) => {
    if (panelId && panelId !== 'all' && panelId !== 'main') {
      return timerState.panelAlerts?.[panelId] || timerState.activeAlert;
    }
    return timerState.activeAlert;
  }, [timerState.panelAlerts, timerState.activeAlert]);

  const getPopupForPanel = useCallback((panelId) => {
    if (panelId && panelId !== 'all' && panelId !== 'main') {
      return timerState.panelPopups?.[panelId] || timerState.activePopupImage;
    }
    return timerState.activePopupImage;
  }, [timerState.panelPopups, timerState.activePopupImage]);

  const triggerAlert = useCallback((alertConfig, targetPanel = 'all') => {
    playClickSound();
    const alertData = {
      id: 'alert-' + Date.now(),
      startTime: Date.now(),
      targetPanel,
      ...alertConfig,
    };

    setTimerState((prev) => {
      let next;
      if (targetPanel === 'all') {
        next = { ...prev, activeAlert: alertData };
      } else {
        next = {
          ...prev,
          panelAlerts: {
            ...(prev.panelAlerts || {}),
            [targetPanel]: alertData,
          },
        };
      }
      persistState(next);
      return next;
    });

    broadcastLocal({ type: 'TRIGGER_ALERT', payload: alertData });
    syncService.sendTriggerAlert(alertData, targetPanel);

    if (timerState.soundEnabled) {
      playKollywoodFanfare();
    }
  }, [timerState.soundEnabled, persistState, broadcastLocal]);

  const dismissAlert = useCallback((targetPanel = 'all') => {
    playClickSound();
    setTimerState((prev) => {
      let next;
      if (targetPanel === 'all') {
        next = { ...prev, activeAlert: null };
      } else {
        next = {
          ...prev,
          panelAlerts: {
            ...(prev.panelAlerts || {}),
            [targetPanel]: null,
          },
        };
      }
      persistState(next);
      return next;
    });
    broadcastLocal({ type: 'DISMISS_ALERT', payload: { targetPanel } });
    syncService.sendDismissAlert(targetPanel);
  }, [persistState, broadcastLocal]);

  // Trigger bottom-to-top popup image on target screen(s)
  const triggerPopupImage = useCallback((buttonItem, targetPanel = 'all') => {
    playClickSound();
    const popupData = {
      id: 'popup-' + Date.now(),
      image: buttonItem.image,
      title: buttonItem.title,
      subtitle: buttonItem.subtitle,
      tag: buttonItem.tag,
      targetPanel,
      timestamp: Date.now(),
    };

    setTimerState((prev) => {
      let next;
      if (targetPanel === 'all') {
        next = { ...prev, activePopupImage: popupData };
      } else {
        next = {
          ...prev,
          panelPopups: {
            ...(prev.panelPopups || {}),
            [targetPanel]: popupData,
          },
        };
      }
      persistState(next);
      return next;
    });

    broadcastLocal({ type: 'TRIGGER_POPUP_IMAGE', payload: popupData });
    syncService.sendTriggerPopup(popupData, targetPanel);

    if (timerState.soundEnabled) {
      playCinemaWhistle();
    }
  }, [timerState.soundEnabled, persistState, broadcastLocal]);

  const dismissPopupImage = useCallback((targetPanel = 'all') => {
    playClickSound();
    setTimerState((prev) => {
      let next;
      if (targetPanel === 'all') {
        next = { ...prev, activePopupImage: null };
      } else {
        next = {
          ...prev,
          panelPopups: {
            ...(prev.panelPopups || {}),
            [targetPanel]: null,
          },
        };
      }
      persistState(next);
      return next;
    });
    broadcastLocal({ type: 'DISMISS_POPUP_IMAGE', payload: { targetPanel } });
    syncService.sendDismissPopup(targetPanel);
  }, [persistState, broadcastLocal]);

  const toggleSound = useCallback(() => {
    setTimerState((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      persistState(next);
      broadcastLocal({ type: 'SYNC_STATE', payload: next });
      syncService.sendSyncState(next);
      return next;
    });
  }, [persistState, broadcastLocal]);

  const value = {
    ...timerState,
    syncStatus,
    connectedClients,
    backendUrl,
    configureBackend,
    getAlertForPanel,
    getPopupForPanel,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTime,
    setExactTime,
    triggerAlert,
    dismissAlert,
    triggerPopupImage,
    dismissPopupImage,
    toggleSound,
  };

  return (
    <CountdownContext.Provider value={value}>
      {children}
    </CountdownContext.Provider>
  );
}

export function useCountdown() {
  const context = useContext(CountdownContext);
  if (!context) {
    throw new Error('useCountdown must be used within CountdownProvider');
  }
  return context;
}
