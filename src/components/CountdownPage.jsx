import React, { useEffect, useRef, useState } from 'react';
import { useCountdown } from '../context/CountdownContext';
import AlertOverlay from './AlertOverlay';
import PopupImageOverlay from './PopupImageOverlay';
import { Volume2, VolumeX, Maximize, Minimize, Star, Film, AlertCircle, Pause, Play } from 'lucide-react';

export default function CountdownPage({ panelId = 'main' }) {
  const {
    remainingTimeMs,
    isRunning,
    getAlertForPanel,
    getPopupForPanel,
    soundEnabled,
    shotCount,
    syncStatus,
    toggleSound,
    dismissAlert,
    dismissPopupImage,
  } = useCountdown();

  const isPanel = panelId && panelId !== 'main' && panelId !== 'all';
  const panelDisplayName = isPanel ? panelId.toUpperCase() : 'MAIN STAGE';
  const sceneLabel = isPanel ? panelId.toUpperCase() : 'DEVFORGE';

  const activeAlert = getAlertForPanel(panelId);
  const activePopupImage = getPopupForPanel(panelId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const canvasRef = useRef(null);

  // Update document title for stage
  useEffect(() => {
    document.title = isPanel
      ? `DevForge ${panelDisplayName} — 24H Countdown`
      : 'DevForge — 24H Clapperboard Countdown';
  }, [isPanel, panelDisplayName]);

  // Local time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ambient cinema projector beam & floating dust particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 60;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      size: Math.random() * 2.2 + 0.8,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.4 ? '251, 191, 36' : '245, 158, 11',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Projector light cone
      const gradient = ctx.createRadialGradient(
        width / 2, -50, 20,
        width / 2, height / 2, width * 0.65
      );
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
      gradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.04)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Floating dust particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Time calculations
  const totalSeconds = Math.max(0, Math.floor(remainingTimeMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="kollywood-stage-wrapper">
      <canvas ref={canvasRef} className="cinema-canvas-bg" />

      {/* Decorative Warm Spotlights */}
      <div className="spotlight-orb spotlight-left"></div>
      <div className="spotlight-orb spotlight-right"></div>

      <div className="cinema-stage-content">
        {/* Cinema Marquee Header */}
        <header className="cinema-header">
          <div className="cinema-branding">
            <div className="marquee-banner">
              <Star size={13} fill="currentColor" className="marquee-star-icon" />
              <span className="marquee-title-badge">
                {isPanel ? `DEVFORGE 2026 • LAB ${panelDisplayName}` : 'DEVFORGE PRODUCTIONS PRESENTS'}
              </span>
              <Star size={13} fill="currentColor" className="marquee-star-icon" />
            </div>
            <h1 className="cinema-event-title">
              {isPanel ? `${panelDisplayName} • 24-HOUR HACKATHON` : '24-HOUR HACKATHON COUNTDOWN'}
            </h1>
            <p className="cinema-credits-line">
              PRODUCER: <strong>ITA</strong> • CREW: <strong>DEVELOPERS</strong> • LAB: <strong>{panelDisplayName}</strong>
            </p>
          </div>

          <div className="cinema-meta-info">
            <div className={`cinema-status-badge ${isRunning ? 'badge-action' : remainingTimeMs === 0 ? 'badge-packup' : 'badge-interval'}`}>
              <span className="status-dot"></span>
              <span className="status-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {isRunning ? (
                  <>ACTION! LIVE <Play size={12} fill="currentColor" /></>
                ) : remainingTimeMs === 0 ? (
                  <>TIME EXPIRED <AlertCircle size={14} /></>
                ) : (
                  <>PAUSED <Pause size={13} fill="currentColor" /></>
                )}
              </span>
            </div>

            <div className="cinema-clock-chip">
              <span className="clock-chip-label">LOCAL TIME</span>
              <span className="clock-chip-val">{currentTimeStr}</span>
            </div>

            {syncStatus === 'connected' && (
              <div className="cinema-sync-chip" title="Real-time Cloud Sync Active">
                <span className="sync-dot-pulse"></span>
                <span>SYNC LIVE</span>
              </div>
            )}
          </div>
        </header>

        {/* Hero Clapperboard Centerpiece */}
        <main className="clapperboard-hero-stage">
          <div className="clapperboard-container">
            {/* Clapperboard Frame Image */}
            <img
              src="/images/image.png"
              alt="Cinema Clapperboard"
              className="clapperboard-frame-img"
            />

            {/* Interactive Slate Overlay */}
            <div className="clapperboard-slate-overlay">
              {/* Slate Header Row (above top line) */}
              <div className="slate-top-header">
                <span className="slate-label">PROD: DEVFORGE 2026</span>
                <span className="slate-label-highlight">{isPanel ? `LAB: ${panelDisplayName}` : '24-HOUR HACKATHON'}</span>
                <span className="slate-label">DIRECTOR: ORGANIZERS</span>
              </div>

              {/* Main Central Countdown Display (between horizontal lines) */}
              <div className="slate-clock-display">
                <div className="chalk-time-unit">
                  <span className="chalk-time-digits">{String(hours).padStart(2, '0')}</span>
                  <span className="chalk-unit-name">HOURS</span>
                </div>

                <span className="chalk-colon">:</span>

                <div className="chalk-time-unit">
                  <span className="chalk-time-digits">{String(minutes).padStart(2, '0')}</span>
                  <span className="chalk-unit-name">MINUTES</span>
                </div>

                <span className="chalk-colon">:</span>

                <div className="chalk-time-unit">
                  <span className="chalk-time-digits">{String(seconds).padStart(2, '0')}</span>
                  <span className="chalk-unit-name">SECONDS</span>
                </div>
              </div>

              {/* Slate Bottom 3 Compartments */}
              <div className="slate-bottom-compartments">
                {/* Box 1: Scene */}
                <div className="slate-box box-scene">
                  <span className="box-title">SCENE</span>
                  <span className="box-value">{sceneLabel}</span>
                </div>

                {/* Box 2: Take */}
                <div className="slate-box box-take">
                  <span className="box-title">TAKE</span>
                  <span className="box-value">{String(shotCount).padStart(2, '0')}</span>
                </div>

                {/* Box 3: Roll / Status */}
                <div className="slate-box box-status">
                  <span className="box-title">ROLL</span>
                  <span className={`box-value ${isRunning ? 'roll-live' : 'roll-idle'}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    {isRunning ? (
                      <>ACTION <Film size={16} /></>
                    ) : (
                      <>PAUSED <Pause size={16} /></>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Stage Footer (NO ADMIN BUTTON) */}
        <footer className="cinema-footer">
          <div className="footer-dialogue">
            <span>"BUILD. INNOVATE. SHIP YOUR MASTERPIECE."</span>
          </div>

          <div className="footer-controls">
            <button
              onClick={toggleSound}
              className="cinema-tool-btn"
              title={soundEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="cinema-tool-btn"
              title="Fullscreen Stage Display"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Synchronized Alert Animation Overlay */}
      <AlertOverlay alert={activeAlert} onDismiss={() => dismissAlert(panelId)} isAdmin={false} />

      {/* Bottom-to-Top Popup Meme Image Overlay */}
      <PopupImageOverlay popup={activePopupImage} onDismiss={() => dismissPopupImage(panelId)} isAdmin={false} />
    </div>
  );
}
