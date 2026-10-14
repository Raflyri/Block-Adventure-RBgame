import React from 'react';

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSoftDrop: () => void;
  onRotate: () => void;
  onHardDrop: () => void;
  onHold: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onSoftDrop,
  onRotate,
  onHardDrop,
  onHold
}) => {
  const handleTouch = (fn: () => void) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <section className="touch-controls" id="touch-controls">
      <div className="touch-group touch-movement">
        <button
          id="touch-left"
          className="touch-btn dpad-btn"
          aria-label="Move Left"
          onTouchStart={handleTouch(onMoveLeft)}
          onClick={handleTouch(onMoveLeft)}
        >
          ◀
        </button>
        <button
          id="touch-down"
          className="touch-btn dpad-btn"
          aria-label="Soft Drop"
          onTouchStart={handleTouch(onSoftDrop)}
          onClick={handleTouch(onSoftDrop)}
        >
          ▼
        </button>
        <button
          id="touch-right"
          className="touch-btn dpad-btn"
          aria-label="Move Right"
          onTouchStart={handleTouch(onMoveRight)}
          onClick={handleTouch(onMoveRight)}
        >
          ▶
        </button>
      </div>

      <div className="touch-group touch-actions">
        <button
          id="touch-hold"
          className="touch-btn key-hold"
          aria-label="Pocket Piece"
          onTouchStart={handleTouch(onHold)}
          onClick={handleTouch(onHold)}
        >
          🎒 POCKET
        </button>
        <button
          id="touch-rotate"
          className="touch-btn key-rotate"
          aria-label="Spin Piece"
          onTouchStart={handleTouch(onRotate)}
          onClick={handleTouch(onRotate)}
        >
          🔄 SPIN
        </button>
        <button
          id="touch-hard-drop"
          className="touch-btn key-drop"
          aria-label="Super Drop"
          onTouchStart={handleTouch(onHardDrop)}
          onClick={handleTouch(onHardDrop)}
        >
          ⚡ DROP!
        </button>
      </div>
    </section>
  );
};
