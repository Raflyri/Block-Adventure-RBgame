import React from 'react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onMainMenu
}) => {
  if (!isOpen) return null;

  return (
    <div id="pause-overlay" className="overlay">
      <div className="overlay-content candy-modal">
        <div className="mascot-face">💤</div>
        <h2 className="overlay-title">Nap Time!</h2>
        <p className="overlay-desc">
          Take a little breather! Your blocks are resting safely.
        </p>
        <div className="modal-actions">
          <button id="resume-game-btn" className="play-big-btn" onClick={onResume}>
            CONTINUE! ▶️
          </button>
          <button
            id="restart-from-pause-btn"
            className="candy-btn-secondary"
            onClick={onRestart}
          >
            TRY AGAIN 🔄
          </button>
          <button
            id="menu-from-pause-btn"
            className="candy-btn-secondary"
            onClick={onMainMenu}
          >
            MAIN MENU 🏠
          </button>
        </div>
      </div>
    </div>
  );
};
