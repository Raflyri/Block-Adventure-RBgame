import React from 'react';
import { GameModeType } from '../types/game';
import { PUZZLE_STAGES } from '../constants/game';

interface StartModalProps {
  isOpen: boolean;
  selectedMode: GameModeType;
  selectedStage: number;
  unlockedStage: number;
  dailyStreak: number;
  onSelectMode: (mode: GameModeType) => void;
  onSelectStage: (stage: number) => void;
  onStartGame: () => void;
}

export const StartModal: React.FC<StartModalProps> = ({
  isOpen,
  selectedMode,
  selectedStage,
  unlockedStage,
  dailyStreak,
  onSelectMode,
  onSelectStage,
  onStartGame
}) => {
  if (!isOpen) return null;

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div id="start-overlay" className="overlay">
      <div className="overlay-content candy-modal bounce-in start-modal-content">
        <div className="mascot-face" id="start-mascot">
          🚀
        </div>
        <div className="modal-badge">RBLOCK ADVENTURE v2.0</div>
        <h2 className="overlay-title" id="start-title">
          Ready to Play?
        </h2>

        {/* Game Mode Switcher Tabs */}
        <div className="mode-tabs-container">
          <button
            className={`mode-tab-btn ${selectedMode === 'classic' ? 'active' : ''}`}
            data-mode="classic"
            id="tab-classic"
            onClick={() => onSelectMode('classic')}
          >
            🎮 Klasik
          </button>
          <button
            className={`mode-tab-btn ${selectedMode === 'daily' ? 'active' : ''}`}
            data-mode="daily"
            id="tab-daily"
            onClick={() => onSelectMode('daily')}
          >
            📅 Daily
          </button>
          <button
            className={`mode-tab-btn ${selectedMode === 'puzzle' ? 'active' : ''}`}
            data-mode="puzzle"
            id="tab-puzzle"
            onClick={() => onSelectMode('puzzle')}
          >
            🧩 Puzzle
          </button>
        </div>

        {/* Mode Info Description Container */}
        <div className="mode-desc-card" id="mode-desc-card">
          {selectedMode === 'classic' && (
            <p className="overlay-desc" id="mode-desc-text">
              Mode arcade murni tak terbatas! Susun balok permen, pecahkan rekor tertinggi, dan gunakan{' '}
              <strong>Candy Bomb 💣</strong>.
            </p>
          )}

          {selectedMode === 'daily' && (
            <>
              <p className="overlay-desc" id="mode-desc-text">
                <strong>Tantangan {todayFormatted}</strong>: Matrix awal berisi rintangan identik untuk semua pemain. Bersihkan{' '}
                <strong>15 baris</strong> secepat mungkin!
              </p>
              <div id="daily-streak-badge" className="daily-streak-badge">
                🔥 Daily Streak: <span id="daily-streak-count">{dailyStreak}</span> Hari
              </div>
            </>
          )}

          {selectedMode === 'puzzle' && (
            <>
              <p className="overlay-desc" id="mode-desc-text">
                Pecahkan <strong>10 teka-teki taktis</strong> bertahap dengan susunan rintangan dan antrian balok terbatas!
              </p>
              <div id="puzzle-stage-picker" className="stage-picker">
                <span className="stage-label">Pilih Stage:</span>
                <div className="stage-buttons-row" id="stage-buttons-container">
                  {PUZZLE_STAGES.map((stg) => {
                    const isLocked = stg.id > unlockedStage;
                    const isSelected = stg.id === selectedStage;
                    return (
                      <button
                        key={stg.id}
                        className={`stage-num-btn ${isSelected ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                        title={`Stage ${stg.id}: ${stg.name}`}
                        disabled={isLocked}
                        onClick={() => onSelectStage(stg.id)}
                      >
                        {isLocked ? '🔒' : stg.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Compact 2-Column Controls Summary Grid */}
        <div className="controls-summary-grid">
          <div className="ctrl-grid-item">
            <div className="ctrl-keys">
              <kbd>←</kbd>
              <kbd>→</kbd>
            </div>
            <span className="ctrl-text">Geser / Drag</span>
          </div>
          <div className="ctrl-grid-item">
            <div className="ctrl-keys">
              <kbd>↑</kbd>
            </div>
            <span className="ctrl-text">Putar / Tap</span>
          </div>
          <div className="ctrl-grid-item">
            <div className="ctrl-keys">
              <kbd>↓</kbd>
            </div>
            <span className="ctrl-text">Soft Drop</span>
          </div>
          <div className="ctrl-grid-item">
            <div className="ctrl-keys">
              <kbd>Space</kbd>
            </div>
            <span className="ctrl-text">Super Drop ⚡</span>
          </div>
          <div className="ctrl-grid-item">
            <div className="ctrl-keys">
              <kbd>C</kbd>
            </div>
            <span className="ctrl-text">Pocket 🎒</span>
          </div>
          <div className="ctrl-grid-item bomb-item">
            <div className="ctrl-keys">💣</div>
            <span className="ctrl-text">1×1 Blast 3×3!</span>
          </div>
        </div>

        <button id="start-game-btn" className="play-big-btn wobble-hover" onClick={onStartGame}>
          LET'S PLAY! 🚀
        </button>
      </div>
    </div>
  );
};
