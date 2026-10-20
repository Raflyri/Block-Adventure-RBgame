import React from 'react';
import { ThemeConfig } from '../types/game';
import { haptics } from '../services/haptics';

interface HeaderProps {
  themeConfig: ThemeConfig;
  isMuted: boolean;
  isPaused: boolean;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  onOpenTheme: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onToggleAudio: () => void;
  onTogglePause: () => void;
  gameMode?: 'classic' | 'sand';
  onToggleGameMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeConfig,
  isMuted,
  isPaused,
  canInstallPwa,
  onInstallPwa,
  onOpenTheme,
  onOpenLeaderboard,
  onOpenSettings,
  onToggleAudio,
  onTogglePause,
  gameMode = 'classic',
  onToggleGameMode
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
        {onToggleGameMode && (
          <button
            id="mode-toggle-btn"
            onClick={() => {
              haptics.menuTap();
              onToggleGameMode();
            }}
            title="Ganti Mode Permainan (Classic / Sand)"
            className={`candy-btn icon-btn mode-switch-badge ${
              gameMode === 'sand'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30'
                : 'bg-purple-500/20 border-purple-400/40 text-purple-200 hover:bg-purple-500/30'
            }`}
          >
            <span className="btn-icon">{gameMode === 'sand' ? '⏳' : '🧱'}</span>
            <span className="btn-label">{gameMode === 'sand' ? 'Sand' : 'Classic'}</span>
          </button>
        )}
        {canInstallPwa && (
          <button
            id="install-pwa-btn"
            className="candy-btn icon-btn install-btn"
            title="Pasang Aplikasi (PWA)"
            aria-label="Pasang Aplikasi"
            onClick={() => {
              haptics.menuTap();
              onInstallPwa();
            }}
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
          onClick={() => {
            haptics.menuTap();
            onOpenTheme();
          }}
        >
          <span className="btn-icon">🎨</span>
          <span className="btn-label">Tema</span>
        </button>
        <button
          id="leaderboard-btn"
          className="candy-btn icon-btn"
          title="Global Leaderboard (L)"
          aria-label="Global Leaderboard"
          onClick={() => {
            haptics.menuTap();
            onOpenLeaderboard();
          }}
        >
          <span className="btn-icon">🏆</span>
          <span className="btn-label">Top 10</span>
        </button>
        <button
          id="settings-btn"
          className="candy-btn icon-btn"
          title="Pengaturan & Sensitivitas Swipe"
          aria-label="Pengaturan"
          onClick={() => {
            haptics.menuTap();
            onOpenSettings();
          }}
        >
          <span className="btn-icon">⚙️</span>
          <span className="btn-label">Settings</span>
        </button>
        <button
          id="audio-toggle-btn"
          className="candy-btn icon-btn"
          title="Toggle Sound (M)"
          aria-label="Toggle Sound"
          onClick={() => {
            haptics.menuTap();
            onToggleAudio();
          }}
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
          onClick={() => {
            haptics.menuTap();
            onTogglePause();
          }}
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
