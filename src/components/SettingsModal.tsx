import React, { useState, useRef } from 'react';
import { haptics } from '../services/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  swipeSensitivity: number; // 1 to 5 (3 is normal: 0.85 multiplier)
  onSwipeSensitivityChange: (val: number) => void;
  sfxVolume: number; // 0 to 100
  onVolumeChange: (val: number) => void;
  onTestSfx: () => void;
  gameSpeedMultiplier: number; // 1.0 to 2.5 (1.0 default)
  onGameSpeedChange: (val: number) => void;
  screenShakeEnabled: boolean;
  onToggleScreenShake: (val: boolean) => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: (val: boolean) => void;
  isHapticsSupported?: boolean;
  onTestHaptics?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
}

export const SENSITIVITY_LABELS: Record<number, { title: string; desc: string; multiplier: number }> = {
  1: { title: 'Firm / Low', desc: 'Requires deliberate longer swipes (prevents accidents)', multiplier: 1.25 },
  2: { title: 'Moderate', desc: 'Slightly firmer swipe travel than default', multiplier: 1.05 },
  3: { title: 'Normal (Default)', desc: 'Balanced response suitable for most screens', multiplier: 0.85 },
  4: { title: 'High / Nimble', desc: 'Short swipe triggers rapid block slide', multiplier: 0.65 },
  5: { title: 'Ultra Fast', desc: 'Feather-touch sensitivity for speedy arcade play', multiplier: 0.45 }
};

export const getSpeedLabel = (multiplier: number): { title: string; desc: string; tag: string } => {
  if (multiplier <= 1.0) {
    return {
      title: 'Standard (1.0×)',
      desc: 'Default balanced arcade pace — perfect for relaxed play and strategic stacking.',
      tag: 'Normal'
    };
  } else if (multiplier <= 1.3) {
    return {
      title: `Swift (${multiplier.toFixed(2)}×)`,
      desc: 'Slightly accelerated gravity (+25%) requiring quicker board assessment.',
      tag: 'Swift'
    };
  } else if (multiplier <= 1.6) {
    return {
      title: `Fast (${multiplier.toFixed(2)}×)`,
      desc: 'Brisk tempo (+50%) for players wanting heightened pace and faster drops.',
      tag: 'Fast'
    };
  } else if (multiplier <= 1.9) {
    return {
      title: `Turbo (${multiplier.toFixed(2)}×)`,
      desc: 'Rapid descent (+75%) testing instant finger coordination and muscle memory.',
      tag: 'Turbo'
    };
  } else if (multiplier <= 2.2) {
    return {
      title: `Insane (${multiplier.toFixed(2)}×)`,
      desc: 'Double drop speed (2.0×) for arcade masters craving maximum challenge.',
      tag: 'Insane'
    };
  } else {
    return {
      title: `Hyper (${multiplier.toFixed(2)}×)`,
      desc: 'Extreme hyper-velocity gravity! Ultra fast reflexes strictly required.',
      tag: 'Hyper'
    };
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  swipeSensitivity,
  onSwipeSensitivityChange,
  sfxVolume,
  onVolumeChange,
  onTestSfx,
  gameSpeedMultiplier,
  onGameSpeedChange,
  screenShakeEnabled,
  onToggleScreenShake,
  hapticsEnabled = true,
  onToggleHaptics,
  isHapticsSupported = true,
  onTestHaptics,
  isMuted,
  onToggleMute,
  onClose
}) => {
  // Interactive test area state
  const [testPositionX, setTestPositionX] = useState<number>(0);
  const [testSwipeCount, setTestSwipeCount] = useState<number>(0);
  const [, setLastSwipeDirection] = useState<'left' | 'right' | null>(null);

  const testTouchTrackRef = useRef<{ startX: number; lastX: number; isActive: boolean }>({
    startX: 0,
    lastX: 0,
    isActive: false
  });

  if (!isOpen) return null;

  const currentInfo = SENSITIVITY_LABELS[swipeSensitivity] || SENSITIVITY_LABELS[3];

  // Test swipe logic based on current sensitivity
  const handleTestTouchStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    testTouchTrackRef.current = {
      startX: clientX,
      lastX: clientX,
      isActive: true
    };
  };

  const handleTestTouchMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!testTouchTrackRef.current.isActive) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dx = clientX - testTouchTrackRef.current.lastX;

    // Base test block size is ~40px
    const testBlockSize = 40;
    const currentMultiplier = currentInfo.multiplier;
    const testThreshold = testBlockSize * currentMultiplier;

    if (Math.abs(dx) >= testThreshold) {
      if (dx > 0) {
        setTestPositionX((prev) => Math.min(prev + 36, 108));
        setLastSwipeDirection('right');
      } else {
        setTestPositionX((prev) => Math.max(prev - 36, -108));
        setLastSwipeDirection('left');
      }
      setTestSwipeCount((c) => c + 1);
      testTouchTrackRef.current.lastX = clientX;
    }
  };

  const handleTestTouchEnd = () => {
    testTouchTrackRef.current.isActive = false;
  };

  const resetTestBlock = () => {
    setTestPositionX(0);
    setLastSwipeDirection(null);
  };

  return (
    <div id="settings-overlay" className="overlay">
      <div className="overlay-content candy-modal bounce-in settings-modal-box">
        <div className="mascot-face">⚙️</div>
        <div className="modal-badge">PREFERENCES & CONTROLS</div>
        <h2 className="overlay-title">Game Settings</h2>
        <p className="overlay-desc">
          Customize swipe responsiveness and audio levels to match your play style.
        </p>

        {/* Sound Effects Volume Section Card */}
        <div className="settings-section-card sfx-volume-card">
          <div className="settings-card-header">
            <div className="settings-header-left">
              <span className="settings-emoji">
                {isMuted ? '🔇' : sfxVolume === 0 ? '🔈' : sfxVolume < 50 ? '🔉' : '🔊'}
              </span>
              <div>
                <strong className="settings-group-title">Sound Effect Volume</strong>
                <span className="settings-group-sub">
                  {isMuted
                    ? 'Currently Muted (Volume saved at ' + sfxVolume + '%)'
                    : sfxVolume === 0
                    ? 'Silent (0%)'
                    : 'Loudness: ' + sfxVolume + '%'}
                </span>
              </div>
            </div>
            <div className="header-badges-row">
              {isMuted && <span className="muted-pill-badge">Muted 🔇</span>}
              <span className="sensitivity-badge volume-badge">{sfxVolume}%</span>
            </div>
          </div>

          <p className="sensitivity-explanation">
            Adjust the in-game arcade volume (moves, rotations, line clears & explosions) independently of muting.
          </p>

          {/* Volume Slider */}
          <div className="slider-wrapper">
            <span className="slider-label">0%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sfxVolume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
              className="candy-slider volume-candy-slider"
              aria-label="Sound Effect Volume Slider"
            />
            <span className="slider-label">100%</span>
          </div>

          {/* Volume Quick Presets & Test Button */}
          <div className="volume-actions-row">
            <div className="preset-buttons-row volume-preset-row">
              {[25, 50, 75, 100].map((vol) => {
                const isSelected = sfxVolume === vol;
                return (
                  <button
                    key={vol}
                    type="button"
                    className={`preset-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => onVolumeChange(vol)}
                  >
                    <span className="preset-num">{vol}%</span>
                    <span className="preset-text">
                      {vol === 25 ? 'Soft' : vol === 50 ? 'Med' : vol === 75 ? 'Clear' : 'Max'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="test-sfx-btn"
              title="Test Sound at Current Volume"
              onClick={onTestSfx}
            >
              <span className="test-btn-icon">🔔</span>
              <span className="test-btn-text">Test Sound</span>
            </button>
          </div>
        </div>

        {/* Game Speed Multiplier Card */}
        <div className="settings-section-card speed-multiplier-card">
          <div className="settings-card-header">
            <div className="settings-header-left">
              <span className="settings-emoji">⚡</span>
              <div>
                <strong className="settings-group-title">Game Speed Multiplier</strong>
                <span className="settings-group-sub">
                  {gameSpeedMultiplier <= 1.0
                    ? 'Default Speed (1.00×)'
                    : `Boosted Pace: +${Math.round((gameSpeedMultiplier - 1) * 100)}% Faster Gravity`}
                </span>
              </div>
            </div>
            <div className="header-badges-row">
              {gameSpeedMultiplier > 1.0 && (
                <span className="speed-boost-badge">🔥 Challenging</span>
              )}
              <span className="sensitivity-badge speed-badge">
                {gameSpeedMultiplier.toFixed(2)}×
              </span>
            </div>
          </div>

          <p className="sensitivity-explanation">
            {getSpeedLabel(gameSpeedMultiplier).desc}
          </p>

          {/* Speed Slider */}
          <div className="slider-wrapper">
            <span className="slider-label">1.0×</span>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={gameSpeedMultiplier}
              onChange={(e) => onGameSpeedChange(parseFloat(e.target.value))}
              className="candy-slider speed-candy-slider"
              aria-label="Game Speed Multiplier Slider"
            />
            <span className="slider-label">2.5×</span>
          </div>

          {/* Speed Quick Presets */}
          <div className="preset-buttons-row speed-preset-row">
            {[1.0, 1.25, 1.5, 1.75, 2.0, 2.5].map((spd) => {
              const isSelected = Math.abs(gameSpeedMultiplier - spd) < 0.03;
              const spdInfo = getSpeedLabel(spd);
              return (
                <button
                  key={spd}
                  type="button"
                  className={`preset-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => onGameSpeedChange(spd)}
                >
                  <span className="preset-num">{spd.toFixed(spd % 1 === 0 ? 1 : 2)}×</span>
                  <span className="preset-text">{spdInfo.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Drop interval dynamic preview ticker */}
          <div className="speed-preview-ticker">
            <div className="ticker-left">
              <span className="ticker-icon">⏱️</span>
              <span className="ticker-label">
                Level 1 Drop: <strong>~{Math.round(1000 / gameSpeedMultiplier)} ms/row</strong>
              </span>
            </div>
            <span className="ticker-status">
              {gameSpeedMultiplier <= 1.0
                ? 'Standard gravity (1000ms)'
                : `${1000 - Math.round(1000 / gameSpeedMultiplier)}ms faster drop!`}
            </span>
          </div>
        </div>

        {/* Swipe Sensitivity Card */}
        <div className="settings-section-card">
          <div className="settings-card-header">
            <div className="settings-header-left">
              <span className="settings-emoji">👆</span>
              <div>
                <strong className="settings-group-title">Swipe Sensitivity</strong>
                <span className="settings-group-sub">Trigger distance: {currentInfo.multiplier}× block</span>
              </div>
            </div>
            <span className="sensitivity-badge level-badge">{currentInfo.title}</span>
          </div>

          <p className="sensitivity-explanation">{currentInfo.desc}</p>

          {/* Slider */}
          <div className="slider-wrapper">
            <span className="slider-label">Firm</span>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={swipeSensitivity}
              onChange={(e) => onSwipeSensitivityChange(parseInt(e.target.value, 10))}
              className="candy-slider"
              aria-label="Swipe Sensitivity Slider"
            />
            <span className="slider-label">Ultra</span>
          </div>

          {/* Preset Buttons */}
          <div className="preset-buttons-row">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const info = SENSITIVITY_LABELS[lvl];
              const isSelected = lvl === swipeSensitivity;
              return (
                <button
                  key={lvl}
                  type="button"
                  className={`preset-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => onSwipeSensitivityChange(lvl)}
                >
                  <span className="preset-num">{lvl}</span>
                  <span className="preset-text">
                    {lvl === 1 ? 'Firm' : lvl === 3 ? 'Normal' : lvl === 5 ? 'Ultra' : info.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Test Zone */}
          <div className="test-zone-container">
            <div className="test-zone-header">
              <span className="test-zone-label">🧪 Swipe Test Track</span>
              <span className="test-zone-counter">
                {testSwipeCount > 0 ? `${testSwipeCount} moves triggered` : 'Swipe finger here to test!'}
              </span>
            </div>
            <div
              className="test-track-area"
              onTouchStart={handleTestTouchStart}
              onTouchMove={handleTestTouchMove}
              onTouchEnd={handleTestTouchEnd}
              onMouseDown={handleTestTouchStart}
              onMouseMove={handleTestTouchMove}
              onMouseUp={handleTestTouchEnd}
              onMouseLeave={handleTestTouchEnd}
            >
              <div className="test-track-center-marker"></div>
              <div
                className="test-moving-block"
                style={{
                  transform: `translateX(${testPositionX}px)`,
                  transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                🍬
              </div>
              <div className="test-guide-hints">
                <span className="hint-arrow">◀ Swipe Left</span>
                <span className="hint-arrow">Swipe Right ▶</span>
              </div>
            </div>
            {testPositionX !== 0 && (
              <button type="button" className="test-reset-btn" onClick={resetTestBlock}>
                Reset Position ↺
              </button>
            )}
          </div>
        </div>

        {/* Other Gameplay Toggles */}
        <div className="settings-toggles-card">
          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-emoji">{isMuted ? '🔇' : '🔊'}</span>
              <div>
                <strong>Mute Audio</strong>
                <span className="toggle-desc">
                  {isMuted ? 'Audio is currently muted' : 'Audio is active and unmuted'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`toggle-switch ${isMuted ? 'on mute-active' : 'off'}`}
              onClick={() => {
                haptics.menuTap();
                onToggleMute();
              }}
              aria-label="Toggle mute state"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-emoji">📳</span>
              <div>
                <div className="toggle-title-with-badge">
                  <strong>Vibration Haptics</strong>
                  {isHapticsSupported ? (
                    <span className="badge-micro online">Vibration API Ready</span>
                  ) : (
                    <span className="badge-micro warning">Mobile/PWA Only</span>
                  )}
                </div>
                <span className="toggle-desc">
                  Tactile feedback on line clears, hard drops, rotates, and buttons
                </span>
              </div>
            </div>
            <div className="toggle-actions-cluster">
              {isHapticsSupported && hapticsEnabled && onTestHaptics && (
                <button
                  type="button"
                  className="test-haptic-btn"
                  title="Test Vibration Feel"
                  onClick={() => {
                    haptics.menuTap();
                    onTestHaptics();
                  }}
                >
                  <span className="test-btn-icon">📳</span>
                  <span className="test-btn-text">Test</span>
                </button>
              )}
              <button
                type="button"
                className={`toggle-switch ${hapticsEnabled ? 'on' : 'off'}`}
                onClick={() => {
                  haptics.menuTap();
                  onToggleHaptics?.(!hapticsEnabled);
                }}
                aria-label="Toggle vibration haptics"
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-emoji">💫</span>
              <div>
                <strong>Screen Shake VFX</strong>
                <span className="toggle-desc">Rumble camera on hard drops and bomb blasts</span>
              </div>
            </div>
            <button
              type="button"
              className={`toggle-switch ${screenShakeEnabled ? 'on' : 'off'}`}
              onClick={() => {
                haptics.menuTap();
                onToggleScreenShake(!screenShakeEnabled);
              }}
              aria-label="Toggle screen shake"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button
            id="close-settings-btn"
            className="play-big-btn"
            onClick={() => {
              haptics.menuTap();
              onClose();
            }}
          >
            Simpan & Selesai ✨
          </button>
        </div>
      </div>
    </div>
  );
};
