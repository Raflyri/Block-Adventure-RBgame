import React, { useState, useEffect, useRef } from 'react';
import {
  aiShoutcaster,
  ShoutcasterMessage,
  ShoutcasterMood
} from '../services/aiShoutcaster';
import { haptics } from '../services/haptics';

interface ShoutcasterAvatarProps {
  enabled?: boolean;
}

const MOOD_EMOJI: Record<ShoutcasterMood, string> = {
  idle: '🤖',
  excited: '🤩',
  combo: '🔥',
  panic: '😱',
  celebrate: '👑'
};

export const ShoutcasterAvatar: React.FC<ShoutcasterAvatarProps> = ({ enabled = true }) => {
  const [message, setMessage] = useState<ShoutcasterMessage | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [mood, setMood] = useState<ShoutcasterMood>('idle');
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const hideTimerRef = useRef<any>(null);

  // Subscribe to AI Shoutcaster events
  useEffect(() => {
    const unsubscribe = aiShoutcaster.subscribe((newMsg) => {
      setMessage(newMsg);
      setMood(newMsg.mood);
      setIsVisible(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setMood('idle');
      }, 5500);
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Periodic natural eye-blink animation when idle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  if (!enabled) return null;

  return (
    <div
      id="ai-shoutcaster-widget"
      className={`shoutcaster-container mood-${mood} ${isMinimized ? 'minimized' : ''}`}
      aria-live="polite"
    >
      {/* Dynamic Speech Bubble */}
      {isVisible && message && !isMinimized && (
        <div
          key={message.id}
          className={`shoutcaster-bubble bubble-mood-${mood}`}
          role="status"
        >
          <div className="shoutcaster-bubble-header">
            <span className="caster-name">🎙️ RB-CASTER AI</span>
            <span className={`caster-source-badge ${message.source === 'gemini' ? 'gemini' : 'local'}`}>
              {message.source === 'gemini' ? '✨ Gemini AI' : '⚡ Instant AI'}
            </span>
          </div>
          <p className="shoutcaster-text">{message.text}</p>
        </div>
      )}

      {/* Floating Mascot Avatar Button */}
      <button
        type="button"
        className={`shoutcaster-avatar-btn anim-${mood} ${isBlinking ? 'blinking' : ''}`}
        onClick={() => {
          haptics.menuTap();
          if (isMinimized) {
            setIsMinimized(false);
            setIsVisible(true);
          } else if (isVisible) {
            setIsVisible(false);
          } else if (message) {
            setIsVisible(true);
          }
        }}
        title="RB-Caster AI Mascot (Klik untuk tampil/sembunyikan komentar)"
        aria-label="AI Shoutcaster Mascot"
      >
        <div className="avatar-glow-ring" />
        <div className="avatar-face">
          <span className="avatar-emoji">{MOOD_EMOJI[mood] || '🤖'}</span>
          <span className="avatar-eyes">
            <span className="eye left-eye" />
            <span className="eye right-eye" />
          </span>
        </div>
        <span className="avatar-mic-badge">🎧</span>
      </button>
    </div>
  );
};
