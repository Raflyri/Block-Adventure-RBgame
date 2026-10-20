import React from 'react';
import { GameModeType } from '../types/game';
import { PUZZLE_STAGES } from '../constants/game';
import { haptics } from '../services/haptics';

interface StartModalProps {
  isOpen: boolean;
  selectedMode: GameModeType;
  selectedStage: number;
  unlockedStage: number;
  dailyStreak: number;
  onSelectMode: (mode: GameModeType) => void;
  onSelectStage: (stage: number) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  gameMode?: 'classic' | 'sand';
  onSelectGameMode?: (mode: 'classic' | 'sand') => void;
  bestScoreClassic?: number;
  bestScoreSand?: number;
}

export const StartModal: React.FC<StartModalProps> = ({
  isOpen,
  selectedMode,
  selectedStage,
  unlockedStage,
  dailyStreak,
  onSelectMode,
  onSelectStage,
  onStartGame,
  onOpenSettings,
  gameMode = 'classic',
  onSelectGameMode,
  bestScoreClassic = 0,
  bestScoreSand = 0
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

        {/* Dual Mode Selector Card (Classic Block vs Sand Physics) */}
        <div className="mb-4 text-left" style={{ width: '100%', marginBottom: '16px' }}>
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 text-center" style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d8b4fe', marginBottom: '8px', textAlign: 'center' }}>
            Pilih Mode Permainan
          </label>
          <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                haptics.menuTap();
                onSelectGameMode?.('classic');
              }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                gameMode === 'classic'
                  ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: gameMode === 'classic' ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: gameMode === 'classic' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div className="flex items-center justify-between mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="text-lg" style={{ fontSize: '18px' }}>🧱</span>
                {gameMode === 'classic' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950" style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#fbbf24', color: '#020617' }}>
                    AKTIF
                  </span>
                )}
              </div>
              <div className="font-bold text-sm text-white" style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Classic Block</div>
              <div className="text-[11px] text-purple-200/80 leading-tight mt-0.5" style={{ fontSize: '11px', color: 'rgba(233, 213, 255, 0.8)', lineHeight: 1.25, marginTop: '2px' }}>
                Susun balok permen klasik & ratakan baris penuh.
              </div>
              <div className="mt-2 text-[11px] font-semibold text-amber-300" style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: '#fcd34d' }}>
                🏆 Best: {bestScoreClassic.toLocaleString()}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.menuTap();
                onSelectGameMode?.('sand');
              }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                gameMode === 'sand'
                  ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: gameMode === 'sand' ? '2px solid #22d3ee' : '2px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: gameMode === 'sand' ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div className="flex items-center justify-between mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="text-lg" style={{ fontSize: '18px' }}>⏳</span>
                {gameMode === 'sand' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950" style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#22d3ee', color: '#020617' }}>
                    BARU
                  </span>
                )}
              </div>
              <div className="font-bold text-sm text-white" style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Sand Physics</div>
              <div className="text-[11px] text-purple-200/80 leading-tight mt-0.5" style={{ fontSize: '11px', color: 'rgba(233, 213, 255, 0.8)', lineHeight: 1.25, marginTop: '2px' }}>
                Balok meleleh jadi pasir! Hubungkan warna kiri ke kanan.
              </div>
              <div className="mt-2 text-[11px] font-semibold text-cyan-300" style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: '#67e8f9' }}>
                🏆 Best: {bestScoreSand.toLocaleString()}
              </div>
            </button>
          </div>
        </div>

        {/* Game Mode Switcher Tabs */}
        <div className="mode-tabs-container">
          <button
            className={`mode-tab-btn ${selectedMode === 'classic' ? 'active' : ''}`}
            data-mode="classic"
            id="tab-classic"
            onClick={() => {
              haptics.menuTap();
              onSelectMode('classic');
            }}
          >
            🎮 Klasik
          </button>
          <button
            className={`mode-tab-btn ${selectedMode === 'daily' ? 'active' : ''}`}
            data-mode="daily"
            id="tab-daily"
            onClick={() => {
              haptics.menuTap();
              onSelectMode('daily');
            }}
          >
            📅 Daily
          </button>
          <button
            className={`mode-tab-btn ${selectedMode === 'puzzle' ? 'active' : ''}`}
            data-mode="puzzle"
            id="tab-puzzle"
            onClick={() => {
              haptics.menuTap();
              onSelectMode('puzzle');
            }}
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
                        onClick={() => {
                          haptics.menuTap();
                          onSelectStage(stg.id);
                        }}
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

        <button
          id="start-game-btn"
          className="play-big-btn wobble-hover"
          onClick={() => {
            haptics.menuTap();
            onStartGame();
          }}
        >
          LET'S PLAY! 🚀
        </button>

        <button
          type="button"
          id="open-settings-from-start-btn"
          className="candy-btn-secondary"
          style={{ width: '100%', marginTop: '4px' }}
          onClick={() => {
            haptics.menuTap();
            onOpenSettings();
          }}
        >
          ⚙️ Pengaturan Kontrol & Sensitivitas Swipe
        </button>
      </div>
    </div>
  );
};
