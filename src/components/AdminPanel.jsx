import React, { useState } from 'react';
import { useCountdown, BUTTON_IMAGES } from '../context/CountdownContext';
import {
  Play,
  Pause,
  RotateCcw,
  Utensils,
  Coffee,
  CheckCircle2,
  Film,
  Zap,
  Megaphone,
  Clock,
  Volume2,
  VolumeX,
  XCircle,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  Clapperboard,
  Sliders,
  ArrowUpCircle,
  Radio,
  WifiOff,
  Server,
  Check,
  Crown,
  MapPin,
  Globe,
  Target,
  X
} from 'lucide-react';
import AlertOverlay from './AlertOverlay';
import PopupImageOverlay from './PopupImageOverlay';

const VALID_PANELS = ['cc1', 'cc2', 'cc6', 'cc8'];

export default function AdminPanel({ panelId = 'all', isMasterAdmin = true }) {
  const {
    remainingTimeMs,
    totalDurationMs,
    isRunning,
    activeAlert,
    activePopupImage,
    panelAlerts,
    panelPopups,
    getAlertForPanel,
    getPopupForPanel,
    soundEnabled,
    shotCount,
    syncStatus,
    connectedClients,
    backendUrl,
    configureBackend,
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
  } = useCountdown();

  // Target broadcast destination ('all' or 'cc1' | 'cc2' | 'cc6' | 'cc8')
  // Master Admin can pick 'all' or any panel; Sub-Admin is locked to its panelId
  const [selectedTarget, setSelectedTarget] = useState(isMasterAdmin ? 'all' : panelId);

  // Custom alert form
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customDurationMins, setCustomDurationMins] = useState(15);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Exact time setter
  const [inputHours, setInputHours] = useState(24);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);

  // Backend Sync settings modal
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [inputBackendUrl, setInputBackendUrl] = useState(backendUrl || '');

  // Determine active alert/popup visible for this admin view
  const activeAlertForScope = isMasterAdmin
    ? (selectedTarget === 'all' ? activeAlert : (panelAlerts?.[selectedTarget] || activeAlert))
    : getAlertForPanel(panelId);

  const activePopupForScope = isMasterAdmin
    ? (selectedTarget === 'all' ? activePopupImage : (panelPopups?.[selectedTarget] || activePopupImage))
    : getPopupForPanel(panelId);

  // Clean English Preset Announcements
  const presets = [
    {
      id: 'lunch',
      title: 'LUNCH BREAK',
      subtitle: 'Enjoy your meal and recharge! Food is served in the main dining hall.',
      type: 'lunch',
      theme: 'gold',
      durationMinutes: 45,
      icon: Utensils,
      color: '#f59e0b',
      badge: '45m Duration',
    },
    {
      id: 'refreshment',
      title: 'REFRESHMENT BREAK',
      subtitle: 'Grab hot coffee, energy drinks, and fresh snacks at the hospitality counter.',
      type: 'refreshment',
      theme: 'emerald',
      durationMinutes: 20,
      icon: Coffee,
      color: '#10b981',
      badge: '20m Duration',
    },
    {
      id: 'review',
      title: 'MENTOR REVIEW TIME',
      subtitle: 'Review Round is active! Prepare your architecture diagrams, codebase, and live demo.',
      type: 'review',
      theme: 'purple',
      durationMinutes: null,
      icon: CheckCircle2,
      color: '#a855f7',
      badge: 'Review Active',
    },
    {
      id: 'rush',
      title: 'FINAL CODING RUSH',
      subtitle: 'Final sprint before repository freeze! Commit and deploy your builds now!',
      type: 'rush',
      theme: 'rose',
      durationMinutes: null,
      icon: Zap,
      color: '#f43f5e',
      badge: 'Sprint Mode',
    },
  ];

  const formatTime = (ms) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    triggerAlert(
      {
        type: 'custom',
        title: customTitle.trim().toUpperCase(),
        subtitle: customSubtitle.trim() || 'Official announcement from the Devforge organizing team.',
        durationMinutes: Number(customDurationMins) || 15,
        theme: 'gold',
      },
      selectedTarget
    );

    setCustomTitle('');
    setCustomSubtitle('');
    setShowCustomModal(false);
  };

  const handleApplyCustomTime = (e) => {
    e.preventDefault();
    setExactTime(Number(inputHours), Number(inputMinutes), Number(inputSeconds));
    setShowTimeAdjustModal(false);
  };

  const stageScreenUrl = isMasterAdmin ? '/' : `/${panelId}`;
  const stageScreenLabel = isMasterAdmin ? 'Open Stage Screen' : `Open ${panelId.toUpperCase()} Stage Screen`;

  return (
    <div className="admin-wrapper kollywood-admin-theme">
      {/* Top Panel Navigation Bar */}
      <nav className="admin-panel-nav-bar">
        <div className="panel-nav-left">
          <span className="panel-nav-label">CONTROL PANEL:</span>
          <button
            type="button"
            onClick={() => navigateTo('/admin')}
            className={`panel-nav-pill master-pill ${isMasterAdmin ? 'active' : ''}`}
          >
            <Crown size={15} /> Master Admin
          </button>
          {VALID_PANELS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => navigateTo(`/admin/${p}`)}
              className={`panel-nav-pill ${!isMasterAdmin && panelId === p ? 'active' : ''}`}
            >
              <MapPin size={14} /> {p.toUpperCase()} Admin
            </button>
          ))}
        </div>

        <div className="panel-nav-right">
          <span className="panel-nav-label" style={{ color: 'var(--cinema-gold-bright)' }}>
            ACTIVE: <strong>{isMasterAdmin ? 'MASTER ADMIN (ALL LABS)' : `${panelId.toUpperCase()} LAB ADMIN`}</strong>
          </span>
        </div>
      </nav>

      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-badge">
            <Clapperboard size={20} className="cinema-clapper-icon" />
            <span>{isMasterAdmin ? 'DEVFORGE MASTER CONTROL PANEL' : `DEVFORGE ${panelId.toUpperCase()} CONTROL PANEL`}</span>
          </div>
          <span className="admin-subtitle">
            {isMasterAdmin
              ? `Master Synchronizer • Controls Timer for All Labs • Take: #${shotCount}`
              : `Lab ${panelId.toUpperCase()} Sub-Admin • Stickers & Announcements Scope: ${panelId.toUpperCase()}`}
          </span>
        </div>

        <div className="admin-header-actions">
          {syncStatus === 'connected' && (
            <button
              onClick={() => {
                setInputBackendUrl(backendUrl || '');
                setShowBackendModal(true);
              }}
              className="admin-sync-pill connected"
              title="Real-time backend connected. Click to view sync settings."
            >
              <span className="sync-dot-pulse"></span>
              <span>Live Sync: {connectedClients} screen{connectedClients !== 1 ? 's' : ''}</span>
            </button>
          )}

          {syncStatus === 'connecting' && (
            <button
              onClick={() => {
                setInputBackendUrl(backendUrl || '');
                setShowBackendModal(true);
              }}
              className="admin-sync-pill connecting"
              title="Connecting to real-time backend..."
            >
              <Radio size={14} />
              <span>Connecting...</span>
            </button>
          )}

          {(syncStatus === 'disconnected' || syncStatus === 'local-only') && (
            <button
              onClick={() => {
                setInputBackendUrl(backendUrl || '');
                setShowBackendModal(true);
              }}
              className="admin-sync-pill disconnected"
              title="Operating in local mode. Click to connect to backend server for cross-device sync."
            >
              <WifiOff size={14} />
              <span>Local Mode (Connect Backend)</span>
            </button>
          )}

          <a
            href={stageScreenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-secondary-btn"
            title={`Open ${isMasterAdmin ? 'Main Stage' : panelId.toUpperCase()} Display in New Window`}
          >
            <ExternalLink size={16} />
            <span>{stageScreenLabel}</span>
          </a>

          <button
            onClick={toggleSound}
            className={`admin-icon-btn ${soundEnabled ? 'active' : ''}`}
            title={soundEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="admin-container">
        {/* Broadcast Target Destination Selector (Master Admin Only) */}
        {isMasterAdmin ? (
          <div className="broadcast-target-card">
            <div className="target-header-row">
              <div className="target-header-title">
                <Radio size={18} />
                <span>BROADCAST TARGET DESTINATION</span>
              </div>
              <span className="target-current-hint">
                {selectedTarget === 'all'
                  ? 'Broadcasting to ALL panel screens simultaneously'
                  : `Targeted to ${selectedTarget.toUpperCase()} screen only`}
              </span>
            </div>

            <div className="target-buttons-grid">
              <button
                type="button"
                onClick={() => setSelectedTarget('all')}
                className={`target-btn ${selectedTarget === 'all' ? 'active' : ''}`}
              >
                <Globe size={15} /> All Panels (Global Broadcast)
              </button>
              {VALID_PANELS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedTarget(p)}
                  className={`target-btn ${selectedTarget === p ? 'active' : ''}`}
                >
                  <MapPin size={14} /> {p.toUpperCase()} Only
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel-isolated-banner">
            <CheckCircle2 size={18} />
            <span>
              ISOLATED LAB CONTROL: All stickers, memes, and break announcements triggered below will appear <strong>ONLY ON {panelId.toUpperCase()}</strong> stage.
            </span>
          </div>
        )}

        {/* Master Controls Card */}
        <div className="admin-card master-controls-card">
          <div className="card-top-row">
            <div>
              <span className="card-tag">{isMasterAdmin ? 'MASTER COUNTDOWN TIMER' : `${panelId.toUpperCase()} SYNCHRONIZED TIMER`}</span>
              <h2 className="card-title">24-Hour Clapperboard Countdown</h2>
            </div>

            <div className={`status-pill ${isRunning ? 'status-live' : remainingTimeMs === 0 ? 'status-ended' : 'status-paused'}`}>
              <span className="status-indicator-dot"></span>
              <span>{isRunning ? 'RUNNING' : remainingTimeMs === 0 ? 'EXPIRED' : 'PAUSED'}</span>
            </div>
          </div>

          {/* Big Digital Display */}
          <div className="admin-timer-display">
            <span className="admin-timer-numbers">{formatTime(remainingTimeMs)}</span>
            <span className="admin-timer-sub">Total Duration: {formatTime(totalDurationMs)} • Take: #{shotCount}</span>
          </div>

          {/* Master Buttons vs Read-Only Lock for Sub-Admin */}
          {isMasterAdmin ? (
            <>
              <div className="master-btn-row">
                {!isRunning ? (
                  <button
                    onClick={startTimer}
                    className="action-btn btn-action-start"
                    title="Start or Resume Countdown across all labs"
                  >
                    <Play size={22} fill="currentColor" />
                    <span>START COUNTDOWN</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="action-btn btn-pause"
                    title="Pause Countdown across all labs"
                  >
                    <Pause size={22} fill="currentColor" />
                    <span>PAUSE</span>
                  </button>
                )}

                <button
                  onClick={() => resetTimer(24 * 60 * 60 * 1000)}
                  className="action-btn btn-reset"
                  title="Reset timer to default 24:00:00 across all labs"
                >
                  <RotateCcw size={18} />
                  <span>RESET (24H)</span>
                </button>

                <button
                  onClick={() => setShowTimeAdjustModal(true)}
                  className="action-btn btn-sliders"
                  title="Set Custom Duration across all labs"
                >
                  <Sliders size={18} />
                  <span>SET DURATION</span>
                </button>
              </div>

              {/* Quick Adjust */}
              <div className="quick-adjust-bar">
                <span className="adjust-label">Quick Adjust (All Labs):</span>
                <div className="adjust-pill-group">
                  <button onClick={() => adjustTime(-60 * 60 * 1000)} className="adjust-chip" title="Subtract 1 Hour">
                    <Minus size={12} /> 1h
                  </button>
                  <button onClick={() => adjustTime(-15 * 60 * 1000)} className="adjust-chip" title="Subtract 15 Minutes">
                    <Minus size={12} /> 15m
                  </button>
                  <button onClick={() => adjustTime(-5 * 60 * 1000)} className="adjust-chip" title="Subtract 5 Minutes">
                    <Minus size={12} /> 5m
                  </button>
                  <button onClick={() => adjustTime(5 * 60 * 1000)} className="adjust-chip" title="Add 5 Minutes">
                    <Plus size={12} /> 5m
                  </button>
                  <button onClick={() => adjustTime(15 * 60 * 1000)} className="adjust-chip" title="Add 15 Minutes">
                    <Plus size={12} /> 15m
                  </button>
                  <button onClick={() => adjustTime(60 * 60 * 1000)} className="adjust-chip" title="Add 1 Hour">
                    <Plus size={12} /> 1h
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="subadmin-timer-lock-banner">
              <div className="subadmin-lock-icon">
                <Clock size={24} />
              </div>
              <div className="subadmin-lock-text">
                <h4>Universal 24-Hour Timer (Managed Centrally by Master Admin)</h4>
                <p>
                  The countdown timer is synchronized universally across CC1, CC2, CC6, and CC8. Only the Master Admin can start, pause, or adjust time. You have full independent control over stickers, refreshment breaks, and alerts for <strong>{panelId.toUpperCase()}</strong> below!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Active Announcement Banner */}
        {activeAlertForScope && (
          <div className="admin-active-alert-banner">
            <div className="active-alert-left">
              <div className="pulsing-alert-ring"></div>
              <div>
                <span className="active-alert-label">
                  LIVE ANNOUNCEMENT {activeAlertForScope.targetPanel && activeAlertForScope.targetPanel !== 'all' ? `[LAB: ${activeAlertForScope.targetPanel.toUpperCase()}]` : '[GLOBAL BROADCAST]'}
                </span>
                <h3 className="active-alert-title">{activeAlertForScope.title}</h3>
                <p className="active-alert-sub">{activeAlertForScope.subtitle}</p>
              </div>
            </div>

            <button
              onClick={() => dismissAlert(activeAlertForScope.targetPanel || selectedTarget)}
              className="dismiss-banner-btn"
              title="Dismiss announcement from screen"
            >
              <XCircle size={18} />
              <span>Dismiss Alert</span>
            </button>
          </div>
        )}

        {/* Active Popup Image Banner */}
        {activePopupForScope && (
          <div className="admin-active-popup-banner">
            <div className="active-popup-left">
              <img
                src={activePopupForScope.image}
                alt="Active Popup"
                className="active-popup-thumb"
              />
              <div>
                <span className="active-alert-label">
                  LIVE STICKER ON SCREEN {activePopupForScope.targetPanel && activePopupForScope.targetPanel !== 'all' ? `[LAB: ${activePopupForScope.targetPanel.toUpperCase()}]` : '[GLOBAL BROADCAST]'}
                </span>
                <h3 className="active-alert-title">{activePopupForScope.title}</h3>
                <p className="active-alert-sub">{activePopupForScope.subtitle}</p>
              </div>
            </div>

            <button
              onClick={() => dismissPopupImage(activePopupForScope.targetPanel || selectedTarget)}
              className="dismiss-banner-btn"
              title="Dismiss sticker from screen"
            >
              <XCircle size={18} />
              <span>Dismiss Sticker</span>
            </button>
          </div>
        )}

        {/* Break & Event Announcement Triggers */}
        <div className="admin-card">
          <div className="card-top-row">
            <div>
              <span className="card-tag">
                {isMasterAdmin
                  ? `STAGE ANNOUNCEMENTS & BREAKS (${selectedTarget === 'all' ? 'BROADCAST TO ALL' : selectedTarget.toUpperCase()})`
                  : `${panelId.toUpperCase()} ANNOUNCEMENTS & BREAKS`}
              </span>
              <h2 className="card-title">Quick Action Buttons</h2>
              <p className="card-desc">
                {isMasterAdmin
                  ? `Click any button to trigger an animated announcement overlay on ${selectedTarget === 'all' ? 'all lab screens' : selectedTarget.toUpperCase() + ' only'}.`
                  : `Click any button to trigger an animated announcement overlay specifically on ${panelId.toUpperCase()} screen.`}
              </p>
            </div>

            <button
              onClick={() => setShowCustomModal(true)}
              className="custom-announcement-btn"
            >
              <Megaphone size={16} />
              <span>Custom Message</span>
            </button>
          </div>

          <div className="action-buttons-grid">
            {presets.map((preset) => {
              const IconComponent = preset.icon;
              const isCurrentlyActive = activeAlertForScope?.type === preset.type;

              return (
                <button
                  key={preset.id}
                  onClick={() => triggerAlert(preset, selectedTarget)}
                  className={`preset-action-card ${preset.theme} ${isCurrentlyActive ? 'card-active' : ''}`}
                  style={{ '--accent-color': preset.color }}
                >
                  <div className="preset-card-header">
                    <div className="preset-icon-bubble">
                      <IconComponent size={24} />
                    </div>
                    <span className="preset-badge">{preset.badge}</span>
                  </div>

                  <div className="preset-card-text">
                    <h3 className="preset-title">{preset.title}</h3>
                    <p className="preset-subtitle">{preset.subtitle}</p>
                  </div>

                  <div className="preset-card-footer">
                    <span className="broadcast-trigger-text">
                      {isCurrentlyActive ? 'Showing on Screen' : `Trigger on ${selectedTarget === 'all' ? 'All' : selectedTarget.toUpperCase()} →`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Stage Stickers / Memes (Slides Bottom to Top on Stage) */}
        <div className="admin-card">
          <div className="card-top-row">
            <div>
              <span className="card-tag">
                <Film size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {isMasterAdmin ? `LIVE STICKERS (${selectedTarget === 'all' ? 'ALL LABS' : selectedTarget.toUpperCase()})` : `${panelId.toUpperCase()} LIVE STICKERS`}
              </span>
              <h2 className="card-title">Kollywood Meme & Reaction Buttons</h2>
              <p className="card-desc">
                Click any of these buttons to animate the character sticker image from bottom to top on {isMasterAdmin ? (selectedTarget === 'all' ? 'all screens' : selectedTarget.toUpperCase() + ' only') : panelId.toUpperCase() + ' only'}!
              </p>
            </div>
          </div>

          <div className="meme-buttons-grid">
            {BUTTON_IMAGES.map((item) => {
              const isCurrentlyActive = activePopupForScope?.id?.includes(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => triggerPopupImage(item, selectedTarget)}
                  className={`meme-action-card ${isCurrentlyActive ? 'card-active' : ''}`}
                >
                  <div className="meme-card-image-wrap">
                    <img src={item.image} alt={item.title} className="meme-card-thumb" />
                    <span className="meme-card-tag">{item.tag}</span>
                  </div>

                  <div className="meme-card-info">
                    <h3 className="meme-card-title">{item.title}</h3>
                    <p className="meme-card-sub">{item.subtitle}</p>
                  </div>

                  <div className="meme-card-footer">
                    <span className="meme-trigger-text">
                      <ArrowUpCircle size={14} />
                      {isCurrentlyActive ? 'Showing on Screen' : `Animate on ${selectedTarget === 'all' ? 'All' : selectedTarget.toUpperCase()} ↑`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Mirror Preview */}
        <div className="admin-card preview-card">
          <div className="card-top-row">
            <div>
              <span className="card-tag">STAGE MIRROR</span>
              <h2 className="card-title">{isMasterAdmin ? 'Live Preview (Master)' : `${panelId.toUpperCase()} Screen Preview`}</h2>
            </div>
            {activeAlertForScope && (
              <span className="preview-badge alert-active">
                <Sparkles size={14} /> Alert Overlay Visible
              </span>
            )}
          </div>

          <div className="stage-mini-viewport kollywood-mini-monitor">
            <div className="mini-clapper-slate">
              <span className="mini-slate-label">SCENE: {isMasterAdmin ? 'DEVFORGE' : panelId.toUpperCase()} • TAKE: #{shotCount}</span>
              <div className="stage-mini-clock">{formatTime(remainingTimeMs)}</div>
              <div className="stage-mini-status">
                {isRunning ? '● SPRINT IN PROGRESS' : '● COUNTDOWN PAUSED'}
              </div>
            </div>

            {activeAlertForScope && (
              <div className="mini-alert-preview">
                <span className="mini-alert-badge">ANNOUNCEMENT</span>
                <strong>{activeAlertForScope.title}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Announcement Modal */}
      {showCustomModal && (
        <div className="modal-backdrop" onClick={() => setShowCustomModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Broadcast Custom Announcement ({selectedTarget === 'all' ? 'All Panels' : selectedTarget.toUpperCase()})
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCustomModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SUBMISSION DEADLINE EXTENDED BY 30 MINS"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description / Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Push all final commits to your GitHub repo and submit your Devpost link before repository freeze."
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Break Duration (Minutes, Optional)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="180"
                  value={customDurationMins}
                  onChange={(e) => setCustomDurationMins(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  <Megaphone size={16} />
                  <span>Send to {selectedTarget === 'all' ? 'All Panels' : selectedTarget.toUpperCase()}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exact Time Adjust Modal (Master Admin only) */}
      {showTimeAdjustModal && (
        <div className="modal-backdrop" onClick={() => setShowTimeAdjustModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Set Exact Duration (All Labs)</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowTimeAdjustModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyCustomTime} className="modal-form">
              <p className="modal-desc">
                Enter the exact remaining time to set on the countdown clapperboard for all connected lab screens:
              </p>

              <div className="time-inputs-row">
                <div className="time-input-col">
                  <label className="form-label">Hours</label>
                  <input
                    type="number"
                    className="form-input time-num-input"
                    min="0"
                    max="99"
                    value={inputHours}
                    onChange={(e) => setInputHours(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>

                <span className="time-colon-separator">:</span>

                <div className="time-input-col">
                  <label className="form-label">Minutes</label>
                  <input
                    type="number"
                    className="form-input time-num-input"
                    min="0"
                    max="59"
                    value={inputMinutes}
                    onChange={(e) => setInputMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                </div>

                <span className="time-colon-separator">:</span>

                <div className="time-input-col">
                  <label className="form-label">Seconds</label>
                  <input
                    type="number"
                    className="form-input time-num-input"
                    min="0"
                    max="59"
                    value={inputSeconds}
                    onChange={(e) => setInputSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowTimeAdjustModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  <Clock size={16} />
                  <span>Apply Universal Time</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backend URL Settings Modal */}
      {showBackendModal && (
        <div className="modal-backdrop" onClick={() => setShowBackendModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Backend Cloud Sync Configuration</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowBackendModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-form">
              <div className={`backend-status-banner ${syncStatus}`}>
                <span>Current Status: <strong>{syncStatus.toUpperCase()}</strong></span>
                {syncStatus === 'connected' && (
                  <span>Connected Screens: <strong>{connectedClients}</strong></span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Backend WebSocket URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="e.g. https://devforge-backend.onrender.com or http://localhost:3001"
                  value={inputBackendUrl}
                  onChange={(e) => setInputBackendUrl(e.target.value)}
                />
                <span className="form-helper">
                  Paste the deployed URL of your Node/Express backend server to sync countdown across all projectors and labs.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowBackendModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={() => {
                    configureBackend(inputBackendUrl);
                    setShowBackendModal(false);
                  }}
                >
                  <Server size={16} />
                  <span>Connect Server</span>
                </button>
              </div>

              <div className="backend-info-box">
                <h4>Deployment Guide Quick Reference</h4>
                <ol>
                  <li>Deploy <code>server/server.js</code> to Render, Railway, or VPS.</li>
                  <li>Set environment variable <code>PORT=3001</code>.</li>
                  <li>Enter your backend URL above.</li>
                  <li>Share <code>/cc1</code>, <code>/cc2</code>, <code>/cc6</code>, <code>/cc8</code> with the respective labs!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Alert Animation Overlay for Admin Preview */}
      <AlertOverlay
        alert={activeAlertForScope}
        onDismiss={() => dismissAlert(activeAlertForScope?.targetPanel || selectedTarget)}
        isAdmin={true}
      />

      {/* Bottom-to-Top Popup Meme Image Overlay for Admin Preview */}
      <PopupImageOverlay
        popup={activePopupForScope}
        onDismiss={() => dismissPopupImage(activePopupForScope?.targetPanel || selectedTarget)}
        isAdmin={true}
      />
    </div>
  );
}
