import React, { useState } from 'react';
import { GameModeType } from '../types/game';
import { PUZZLE_STAGES } from '../constants/game';

interface GameOverModalProps {
  isOpen: boolean;
  isVictory: boolean;
  score: number;
  level: number;
  lines: number;
  mode: GameModeType;
  puzzleStage: number;
  customTitle?: string | null;
  customBadge?: string | null;
  onSubmitScore: (name: string) => Promise<{ success: boolean; message: string }>;
  onPlayAgain: () => void;
  onNextStage: () => void;
  onChooseStage: () => void;
  onViewLeaderboard: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isVictory,
  score,
  level,
  lines,
  mode,
  puzzleStage,
  customTitle,
  customBadge,
  onSubmitScore,
  onPlayAgain,
  onNextStage,
  onChooseStage,
  onViewLeaderboard,
  onMainMenu
}) => {
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('rblock_player_name') || '';
    } catch (e) {
      return '';
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ text: string; isSuccess: boolean } | null>(null);

  if (!isOpen) return null;

  const isPuzzle = mode === 'puzzle';
  const hasNextStage = puzzleStage < PUZZLE_STAGES.length;

  let mascot = isVictory ? '🏆' : isPuzzle ? '🧩' : '🌟';
  let badge = customBadge || (isVictory ? 'VICTORY!' : isPuzzle ? 'STAGE FAILED' : 'AWESOME TRY!');
  let title = customTitle || (isVictory ? 'Kamu Berhasil!' : isPuzzle ? 'Balok Habis! Coba Lagi 🧩' : 'Permainan Berakhir');

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitFeedback({ text: 'Menyimpan ke Rekor Dunia... ✨', isSuccess: true });
    const result = await onSubmitScore(playerName);
    setSubmitFeedback({ text: result.message, isSuccess: result.success });
    setIsSubmitting(false);
  };

  return (
    <div id="gameover-overlay" className="overlay">
      <div className="overlay-content candy-modal bounce-in">
        <div className="mascot-face" id="gameover-mascot">
          {mascot}
        </div>
        <div className="modal-badge celebrate-badge" id="gameover-badge">
          {badge}
        </div>
        <h2 className="overlay-title" id="gameover-title">
          {title}
        </h2>

        <div className="star-rating" id="star-rating">
          <span className="star-award">⭐</span>
          <span className="star-award">⭐</span>
          <span className="star-award">⭐</span>
        </div>

        <div className="gameover-stats">
          <div className="stat-pill">
            <span className="pill-label">FINAL SCORE</span>
            <span id="final-score" className="pill-value">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="stat-pill">
            <span className="pill-label" id="final-middle-label">
              {isPuzzle ? 'STAGE' : 'LEVEL'}
            </span>
            <span id="final-level" className="pill-value">
              {isPuzzle ? puzzleStage : level}
            </span>
          </div>
          <div className="stat-pill">
            <span className="pill-label">LINES</span>
            <span id="final-lines" className="pill-value">
              {lines}
            </span>
          </div>
        </div>

        {/* Leaderboard Save Section (for Classic & Daily) */}
        {!isPuzzle && (
          <div className="leaderboard-section" id="leaderboard-save-section">
            <label htmlFor="player-name-input" className="input-label">
              Save to Star Hall of Fame: ✨
            </label>
            <div className="input-group">
              <input
                type="text"
                id="player-name-input"
                placeholder="Nama Kamu"
                maxLength={12}
                autoComplete="off"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <button
                id="submit-score-btn"
                className="action-btn"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan 🏅'}
              </button>
            </div>
            {submitFeedback && (
              <p
                id="leaderboard-feedback"
                className={`status-msg ${submitFeedback.isSuccess ? 'success' : 'error'}`}
              >
                {submitFeedback.text}
              </p>
            )}
          </div>
        )}

        {isPuzzle && isVictory && (
          <button
            id="next-stage-btn"
            className="play-big-btn next-stage-btn wobble-hover"
            style={{ marginBottom: '8px' }}
            disabled={!hasNextStage}
            onClick={onNextStage}
          >
            {hasNextStage ? `STAGE ${puzzleStage + 1} ⏩` : `SEMUA STAGE SELESAI! 👑`}
          </button>
        )}

        {isPuzzle && (
          <button
            id="choose-stage-btn"
            className="candy-btn-secondary"
            style={{ marginBottom: '8px', width: '100%' }}
            onClick={onChooseStage}
          >
            🧩 Pilih Stage Lain
          </button>
        )}

        {!isPuzzle && (
          <button
            id="view-leaderboard-from-gameover-btn"
            className="candy-btn-secondary"
            style={{ marginBottom: '8px', width: '100%' }}
            onClick={onViewLeaderboard}
          >
            🏆 Lihat Rekor Dunia
          </button>
        )}

        <button id="play-again-btn" className="play-big-btn wobble-hover" onClick={onPlayAgain}>
          {isPuzzle ? (isVictory ? 'ULANGI STAGE 🔄' : 'COBA LAGI 🔄') : 'PLAY AGAIN! 🎈'}
        </button>

        <button
          id="menu-from-gameover-btn"
          className="candy-btn-secondary"
          style={{ marginTop: '8px', width: '100%' }}
          onClick={onMainMenu}
        >
          MAIN MENU 🏠
        </button>
      </div>
    </div>
  );
};
