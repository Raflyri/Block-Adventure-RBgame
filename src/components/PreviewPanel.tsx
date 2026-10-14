import React, { useEffect, useRef } from 'react';
import { ActivePiece, ThemeId } from '../types/game';
import { CanvasRenderer } from '../services/renderer';

interface PreviewPanelProps {
  nextPiece: ActivePiece | null;
  holdPiece: string | null;
  lines: number;
  themeId: ThemeId;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  nextPiece,
  holdPiece,
  lines,
  themeId
}) => {
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!nextCanvasRef.current) return;
    const canvas = nextCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 100 * dpr;
    canvas.height = 100 * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    CanvasRenderer.renderMiniPreview(ctx, nextPiece, 100, 100, themeId);
  }, [nextPiece, themeId]);

  useEffect(() => {
    if (!holdCanvasRef.current) return;
    const canvas = holdCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 100 * dpr;
    canvas.height = 100 * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    CanvasRenderer.renderHoldPiece(ctx, holdPiece, 100, 100, themeId);
  }, [holdPiece, themeId]);

  return (
    <aside className="panel preview-panel" id="preview-panel">
      <div className="candy-card preview-card">
        <div className="card-icon-row">
          <span className="stat-emoji">👀</span>
          <span className="card-label">NEXT UP</span>
        </div>
        <div className="preview-box">
          <canvas ref={nextCanvasRef} id="next-canvas" width="100" height="100" />
        </div>
      </div>

      <div className="candy-card preview-card desktop-only-card">
        <div className="card-header-row">
          <div className="card-icon-row">
            <span className="stat-emoji">🎒</span>
            <span className="card-label">POCKET</span>
          </div>
          <span className="key-hint">
            <kbd>C</kbd>
          </span>
        </div>
        <div className="preview-box">
          <canvas ref={holdCanvasRef} id="hold-canvas" width="100" height="100" />
        </div>
      </div>

      <div className="candy-card stat-card lines-stat mobile-only-card">
        <div className="card-icon-row">
          <span className="stat-emoji">🌈</span>
          <span className="card-label">LINES</span>
        </div>
        <span id="lines-display-mobile" className="card-value">
          {lines}
        </span>
      </div>

      <div className="candy-card controls-card desktop-only-card">
        <div className="card-icon-row controls-header">
          <span className="stat-emoji">🎮</span>
          <span className="card-label">CONTROLS</span>
        </div>
        <ul className="key-list">
          <li className="key-item">
            <span className="action-name">Move / Slide</span>
            <span className="key-combo">
              <kbd>←</kbd>
              <kbd>→</kbd>
            </span>
          </li>
          <li className="key-item">
            <span className="action-name">Rotate / Spin</span>
            <span className="key-combo">
              <kbd>↑</kbd>
            </span>
          </li>
          <li className="key-item">
            <span className="action-name">Soft Drop</span>
            <span className="key-combo">
              <kbd>↓</kbd>
            </span>
          </li>
          <li className="key-item">
            <span className="action-name">Super Drop</span>
            <span className="key-combo">
              <kbd>Space</kbd>
            </span>
          </li>
          <li className="key-item">
            <span className="action-name">Pocket</span>
            <span className="key-combo">
              <kbd>C</kbd>
            </span>
          </li>
        </ul>
        <div className="bomb-tip-pill">
          <span className="bomb-icon">💣</span>
          <span className="bomb-desc">
            <strong>1×1 Timed Bomb</strong> clears 3×3!
          </span>
        </div>
      </div>
    </aside>
  );
};
