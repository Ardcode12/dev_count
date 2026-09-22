import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Utensils,
  Coffee,
  CheckCircle2,
  Clock,
  Zap,
  Film,
  Megaphone,
  Star,
  X
} from 'lucide-react';

export default function AlertOverlay({ alert, onDismiss, isAdmin = false }) {
  const [breakRemainingMs, setBreakRemainingMs] = useState(null);

  useEffect(() => {
    if (!alert) return;

    // Vibrant cinema celebration confetti
    const alertColors = ['#f59e0b', '#fbbf24', '#ef4444', '#f97316', '#38bdf8', '#a855f7'];

    confetti({
      particleCount: 85,
      spread: 85,
      origin: { y: 0.28 },
      colors: alertColors,
      disableForReducedMotion: true,
    });

    const secondBurst = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.35 },
        colors: alertColors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.35 },
        colors: alertColors,
      });
    }, 250);

    return () => clearTimeout(secondBurst);
  }, [alert?.id, alert?.type]);

  // Track break countdown
  useEffect(() => {
    if (!alert || !alert.durationMinutes) {
      setBreakRemainingMs(null);
      return;
    }

    const totalMs = alert.durationMinutes * 60 * 1000;
    const updateTime = () => {
      const elapsed = Date.now() - (alert.startTime || Date.now());
      const remaining = Math.max(0, totalMs - elapsed);
      setBreakRemainingMs(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alert]);

  if (!alert) return null;

  const renderIcon = () => {
    switch (alert.type) {
      case 'lunch':
        return (
          <div className="cinema-icon-badge theme-lunch">
            <Utensils className="cinema-icon bounce-animation" size={48} />
          </div>
        );
      case 'refreshment':
        return (
          <div className="cinema-icon-badge theme-refreshment">
            <div className="steam-container">
              <span className="steam-line steam-1"></span>
              <span className="steam-line steam-2"></span>
              <span className="steam-line steam-3"></span>
            </div>
            <Coffee className="cinema-icon" size={48} />
          </div>
        );
      case 'review':
        return (
          <div className="cinema-icon-badge theme-review">
            <CheckCircle2 className="cinema-icon pulse-animation" size={48} />
          </div>
        );
      case 'interval':
        return (
          <div className="cinema-icon-badge theme-interval">
            <Film className="cinema-icon spin-slow" size={48} />
          </div>
        );
      case 'rush':
        return (
          <div className="cinema-icon-badge theme-rush">
            <Zap className="cinema-icon spark-animation" size={48} />
          </div>
        );
      default:
        return (
          <div className="cinema-icon-badge theme-custom">
            <Megaphone className="cinema-icon swing-animation" size={48} />
          </div>
        );
    }
  };

  const formatBreakTime = (ms) => {
    if (ms === null || ms === undefined) return null;
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`kollywood-alert-container ${alert.theme || 'gold'}`}>
      <div className="alert-backdrop" onClick={isAdmin ? onDismiss : undefined} />

      {/* Spotlight beam */}
      <div className="cinema-spotlight-beam"></div>

      <div className="kollywood-title-card animate-cinema-entry" role="alert">
        {/* Clapper strip */}
        <div className="cinema-clapper-strip"></div>

        {/* Top Header Badge */}
        <div className="cinema-card-header">
          <span className="cinema-star-badge">
            <Star size={14} fill="currentColor" /> DEVFORGE LIVE ANNOUNCEMENT <Star size={14} fill="currentColor" />
          </span>
        </div>

        {/* Admin dismiss button */}
        {isAdmin && onDismiss && (
          <button
            className="alert-dismiss-btn"
            onClick={onDismiss}
            title="Dismiss Announcement"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        <div className="cinema-card-body">
          {renderIcon()}

          <div className="cinema-card-content">
            <h1 className="cinema-main-title">{alert.title}</h1>
            <p className="cinema-sub-message">{alert.subtitle}</p>

            {breakRemainingMs !== null && (
              <div className="cinema-timer-reel">
                <Clock size={18} className="timer-icon" />
                <span>BREAK TIME: <strong>{formatBreakTime(breakRemainingMs)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Film Strip Edge */}
        <div className="cinema-card-footer">
          <div className="film-strip-edge">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="sprocket-hole"></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
