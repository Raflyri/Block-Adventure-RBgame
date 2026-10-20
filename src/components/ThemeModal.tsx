import React from 'react';
import { ThemeId } from '../types/game';
import { haptics } from '../services/haptics';

interface ThemeModalProps {
  isOpen: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div id="theme-overlay" className="overlay">
      <div className="overlay-content candy-modal bounce-in theme-modal-box">
        <div className="mascot-face">🎨</div>
        <div className="modal-badge">SKIN & VISUALS</div>
        <h2 className="overlay-title">Pilih Tema Favorit</h2>
        <p className="overlay-desc">Ubah suasana visual dan gaya balok sesuai seleramu!</p>

        <div className="theme-grid">
          <button
            className={`theme-card ${currentTheme === 'candy' ? 'active' : ''}`}
            data-theme="candy"
            id="theme-card-candy"
            onClick={() => {
              haptics.menuTap();
              onSelectTheme('candy');
            }}
          >
            <div className="theme-preview candy-preview">
              <span className="preview-dot p-pink"></span>
              <span className="preview-dot p-yellow"></span>
              <span className="preview-dot p-cyan"></span>
            </div>
            <div className="theme-info">
              <strong className="theme-name">🍬 Candy Jelly</strong>
              <span className="theme-tag">Ceria & Mengkilap</span>
            </div>
          </button>

          <button
            className={`theme-card ${currentTheme === 'neon' ? 'active' : ''}`}
            data-theme="neon"
            id="theme-card-neon"
            onClick={() => {
              haptics.menuTap();
              onSelectTheme('neon');
            }}
          >
            <div className="theme-preview neon-preview">
              <span className="preview-dot p-neon-blue"></span>
              <span className="preview-dot p-neon-pink"></span>
              <span className="preview-dot p-neon-green"></span>
            </div>
            <div className="theme-info">
              <strong className="theme-name">⚡ Cyber Neon</strong>
              <span className="theme-tag">Glow & Synthwave</span>
            </div>
          </button>

          <button
            className={`theme-card ${currentTheme === 'pastel' ? 'active' : ''}`}
            data-theme="pastel"
            id="theme-card-pastel"
            onClick={() => {
              haptics.menuTap();
              onSelectTheme('pastel');
            }}
          >
            <div className="theme-preview pastel-preview">
              <span className="preview-dot p-pastel-peach"></span>
              <span className="preview-dot p-pastel-mint"></span>
              <span className="preview-dot p-pastel-lavender"></span>
            </div>
            <div className="theme-info">
              <strong className="theme-name">🍃 Kawaii Pastel</strong>
              <span className="theme-tag">Lembut & Cozy</span>
            </div>
          </button>

          <button
            className={`theme-card ${currentTheme === 'retro' ? 'active' : ''}`}
            data-theme="retro"
            id="theme-card-retro"
            onClick={() => {
              haptics.menuTap();
              onSelectTheme('retro');
            }}
          >
            <div className="theme-preview retro-preview">
              <span className="preview-dot p-retro-dark"></span>
              <span className="preview-dot p-retro-mid"></span>
              <span className="preview-dot p-retro-light"></span>
            </div>
            <div className="theme-info">
              <strong className="theme-name">🕹️ Retro 8-Bit</strong>
              <span className="theme-tag">GameBoy Arcade</span>
            </div>
          </button>
        </div>

        <div className="modal-actions">
          <button
            id="close-theme-btn"
            className="play-big-btn"
            onClick={() => {
              haptics.menuTap();
              onClose();
            }}
          >
            Simpan & Tutup ✨
          </button>
        </div>
      </div>
    </div>
  );
};
