import React from 'react';
import { haptics } from '../services/haptics';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenSettings,
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
          <button
            id="resume-game-btn"
            className="play-big-btn"
            onClick={() => {
              haptics.menuTap();
              onResume();
            }}
          >
            CONTINUE! ▶️
          </button>
          <button
            id="settings-from-pause-btn"
            className="candy-btn-secondary"
            onClick={() => {
              haptics.menuTap();
              onOpenSettings();
            }}
          >
            SETTINGS ⚙️
          </button>
          <button
            id="restart-from-pause-btn"
            className="candy-btn-secondary"
            onClick={() => {
              haptics.menuTap();
              onRestart();
            }}
          >
            TRY AGAIN 🔄
          </button>
          <button
            id="menu-from-pause-btn"
            className="candy-btn-secondary"
            onClick={() => {
              haptics.menuTap();
              onMainMenu();
            }}
          >
            MAIN MENU 🏠
          </button>
        </div>
      </div>
    </div>
  );
};
