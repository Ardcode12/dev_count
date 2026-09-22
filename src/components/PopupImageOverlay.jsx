import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles } from 'lucide-react';

export default function PopupImageOverlay({ popup, onDismiss }) {
  useEffect(() => {
    if (!popup) return;

    // Confetti cannon
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#fbbf24', '#ef4444', '#f97316', '#38bdf8'],
    });
  }, [popup?.id]);

  if (!popup) return null;

  return (
    <div className="popup-image-overlay-container">
      <div className="popup-image-backdrop" onClick={onDismiss} />

      {/* The Image Animated from Bottom to Top */}
      <div className="popup-image-card slide-bottom-to-top" onClick={(e) => e.stopPropagation()}>
        <button
          className="popup-image-close-btn"
          onClick={onDismiss}
          title="Dismiss"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="popup-image-frame">
          <img
            src={popup.image}
            alt={popup.title || 'Meme sticker'}
            className="popup-actual-image"
          />
        </div>

        {popup.title && (
          <div className="popup-image-footer">
            <span className="popup-image-tag">
              <Sparkles size={14} /> {popup.tag || 'STAGE EVENT'}
            </span>
            <h3 className="popup-image-title">{popup.title}</h3>
            {popup.subtitle && (
              <p className="popup-image-subtitle">{popup.subtitle}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
