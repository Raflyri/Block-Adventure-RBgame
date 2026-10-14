import React, { useRef, useEffect } from 'react';

interface GameBoardProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  particlesCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  bannerInfo: { text: string; isBomb: boolean; visible: boolean };
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  canvasRef,
  particlesCanvasRef,
  bannerInfo,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) => {
  return (
    <section className="canvas-wrapper" id="canvas-wrapper">
      <div className="canvas-container" id="canvas-container">
        <canvas
          ref={canvasRef}
          id="rblock-canvas"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        <canvas ref={particlesCanvasRef} id="particles-canvas" />

        <div
          id="floating-banner"
          className={`floating-banner ${bannerInfo.isBomb ? 'bomb-banner' : ''} ${
            bannerInfo.visible ? '' : 'hidden'
          }`}
        >
          {bannerInfo.text}
        </div>
      </div>
    </section>
  );
};
