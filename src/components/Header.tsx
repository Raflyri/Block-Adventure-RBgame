import React from 'react';
import { ThemeConfig } from '../types/game';

interface HeaderProps {
  themeConfig: ThemeConfig;
  isMuted: boolean;
  isPaused: boolean;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  onOpenTheme: () => void;
  onOpenLeaderboard: () => void;
  onToggleAudio: () => void;
  onTogglePause: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeConfig,
  isMuted,
  isPaused,
  canInstallPwa,
  onInstallPwa,
  onOpenTheme,
  onOpenLeaderboard,
  onToggleAudio,
  onTogglePause
}) => {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="logo-mascot">
          <span className="mascot-block b-pink"></span>
          <span className="mascot-block b-yellow"></span>
          <span className="mascot-block b-cyan"></span>
          <span className="mascot-block b-green"></span>
        </div>
        <div className="brand-text">
          <h1>
            RBlock <span className="accent-badge">ADVENTURE</span>
          </h1>
          <span className="sub-badge" id="header-sub-badge">
            {themeConfig.badge}
          </span>
        </div>
      </div>

      <div className="header-actions">
        {canInstallPwa && (
          <button
            id="install-pwa-btn"
            className="candy-btn icon-btn install-btn"
            title="Pasang Aplikasi (PWA)"
            aria-label="Pasang Aplikasi"
            onClick={onInstallPwa}
          >
            <span className="btn-icon">📲</span>
            <span className="btn-label">Install</span>
          </button>
        )}
        <button
          id="theme-btn"
          className="candy-btn icon-btn"
          title="Pilih Tema / Skin Balok (T)"
          aria-label="Pilih Tema"
          onClick={onOpenTheme}
        >
          <span className="btn-icon">🎨</span>
          <span className="btn-label">Tema</span>
        </button>
        <button
          id="leaderboard-btn"
          className="candy-btn icon-btn"
          title="Global Leaderboard (L)"
          aria-label="Global Leaderboard"
          onClick={onOpenLeaderboard}
        >
          <span className="btn-icon">🏆</span>
          <span className="btn-label">Top 10</span>
        </button>
        <button
          id="audio-toggle-btn"
          className="candy-btn icon-btn"
          title="Toggle Sound (M)"
          aria-label="Toggle Sound"
          onClick={onToggleAudio}
        >
          <span id="audio-icon" className="btn-icon">
            {isMuted ? '🔇' : '🔊'}
          </span>
          <span className="btn-label">Music</span>
        </button>
        <button
          id="pause-btn"
          className="candy-btn icon-btn"
          title="Pause Game (P/Esc)"
          aria-label="Pause Game"
          onClick={onTogglePause}
        >
          <span id="pause-icon" className="btn-icon">
            {isPaused ? '▶️' : '⏸️'}
          </span>
          <span className="btn-label">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      </div>
    </header>
  );
};
