import React, { useEffect, useRef } from 'react';
import { GameModeType, ThemeId } from '../types/game';
import { CanvasRenderer } from '../services/renderer';

interface StatsPanelProps {
  score: number;
  highScore: number;
  level: number;
  lines: number;
  mode: GameModeType;
  puzzleStage: number;
  puzzleTargetLines: number;
  puzzleQueueCount: number;
  dailyTargetLines: number;
  holdPiece: string | null;
  themeId: ThemeId;
  gameSpeedMultiplier?: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  score,
  highScore,
  level,
  lines,
  mode,
  puzzleStage,
  puzzleTargetLines,
  puzzleQueueCount,
  dailyTargetLines,
  holdPiece,
  themeId,
  gameSpeedMultiplier = 1.0
}) => {
  const mobileHoldRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!mobileHoldRef.current) return;
    const canvas = mobileHoldRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 80 * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    CanvasRenderer.renderHoldPiece(ctx, holdPiece, 80, 80, themeId);
  }, [holdPiece, themeId]);

  const speedLabels: Record<number, string> = {
    1: 'Cruising! 🎈',
    2: 'Zippy! ⚡',
    3: 'Breezy! 🚀',
    4: 'Speedy! 🌟',
    5: 'Hyper! 💫'
  };
  const baseSpeed = speedLabels[level] || 'Super Sonic! 🛸';
  const speedText =
    gameSpeedMultiplier > 1.0
      ? `${baseSpeed} (${gameSpeedMultiplier.toFixed(gameSpeedMultiplier % 1 === 0 ? 1 : 2)}×)`
      : baseSpeed;
  const progressPercent = ((score % 1000) / 1000) * 100;

  return (
    <aside className="panel stats-panel" id="stats-panel">
      {/* Pocket / Hold in mobile flank */}
      <div className="candy-card preview-card mobile-only-card" id="mobile-hold-card">
        <div className="card-icon-row">
          <span className="stat-emoji">🎒</span>
          <span className="card-label">POCKET</span>
        </div>
        <div className="preview-box mini-box">
          <canvas ref={mobileHoldRef} id="hold-canvas-mobile" width="80" height="80" />
        </div>
      </div>

      {/* Dynamic Mode Objective Card (for Daily / Puzzle) */}
      {mode === 'daily' && (
        <div id="mode-objective-card" className="candy-card stat-card objective-card">
          <div className="card-icon-row">
            <span className="stat-emoji" id="objective-emoji">🎯</span>
            <span className="card-label" id="objective-title">DAILY TARGET</span>
          </div>
          <span id="objective-value" className="card-value highlight-text">
            {lines} / {dailyTargetLines}
          </span>
          <span id="objective-sub" className="speed-tag">Bersihkan 15 Baris!</span>
        </div>
      )}

      {mode === 'sand' && (
        <div id="mode-objective-card" className="candy-card stat-card objective-card" style={{ borderColor: 'rgba(34, 211, 238, 0.4)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
          <div className="card-icon-row">
            <span className="stat-emoji" id="objective-emoji">⏳</span>
            <span className="card-label" id="objective-title" style={{ color: '#67e8f9' }}>SAND PHYS</span>
          </div>
          <span id="objective-value" className="card-value highlight-text" style={{ color: '#22d3ee' }}>
            60×120
          </span>
          <span id="objective-sub" className="speed-tag" style={{ color: '#a5f3fc' }}>Hubungkan Kiri-Kanan!</span>
        </div>
      )}

      {mode === 'puzzle' && (
        <div id="mode-objective-card" className="candy-card stat-card objective-card">
          <div className="card-icon-row">
            <span className="stat-emoji" id="objective-emoji">🧩</span>
            <span className="card-label" id="objective-title">STAGE {puzzleStage}</span>
          </div>
          <span id="objective-value" className="card-value highlight-text">
            {lines} / {puzzleTargetLines}
          </span>
          <span id="objective-sub" className="speed-tag">
            Sisa Antrian: {puzzleQueueCount}
          </span>
        </div>
      )}

      <div className="candy-card stat-card primary-stat">
        <div className="card-icon-row">
          <span className="stat-emoji">⭐</span>
          <span className="card-label">SCORE</span>
        </div>
        <span id="score-display" className="card-value glow-text">
          {score.toLocaleString()}
        </span>
      </div>

      <div className="candy-card stat-card trophy-stat">
        <div className="card-icon-row">
          <span className="stat-emoji">🏆</span>
          <span className="card-label">BEST</span>
        </div>
        <span id="highscore-display" className="card-value highlight-text">
          {highScore.toLocaleString()}
        </span>
      </div>

      <div className="candy-card stat-card level-stat">
        <div className="card-icon-row">
          <span className="stat-emoji">🚀</span>
          <span className="card-label">LEVEL</span>
        </div>
        <div className="level-container">
          <span id="level-display" className="card-value">
            {level}
          </span>
          <span id="speed-indicator" className="speed-tag">
            {speedText}
          </span>
        </div>
        <div className="level-progress-bar">
          <div
            id="level-progress-fill"
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="candy-card stat-card lines-stat desktop-only-card">
        <div className="card-icon-row">
          <span className="stat-emoji">🌈</span>
          <span className="card-label">LINES</span>
        </div>
        <span id="lines-display" className="card-value">
          {lines}
        </span>
      </div>
    </aside>
  );
};
