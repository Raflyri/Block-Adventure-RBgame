/**
 * ============================================================================
 * WebTetris Edge - Fun Responsive Child-Friendly Edition
 * ============================================================================
 * Fully responsive across Desktop, Tablet, and Mobile Portrait/Landscape.
 * Features dynamic canvas scaling, jelly candy blocks, celebratory particles,
 * dual desktop/mobile hold previews, and cheerful audio.
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. CONSTANTS & CANDY TETROMINO DEFINITIONS
   ============================================================================ */
const COLS = 10;
const ROWS = 20;

// Cheerful Candy-Colored Tetrominoes
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00e5ff', // Sky Cyan
    highlight: '#a7f3d0'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#4361ee', // Berry Blue
    highlight: '#93c5fd'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff7b00', // Tangy Orange
    highlight: '#fed7aa'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffbe0b', // Sunny Yellow
    highlight: '#fef08a'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#06d6a0', // Kiwi Green
    highlight: '#bbf7d0'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a370f7', // Lilac Purple
    highlight: '#e9d5ff'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff4d6d', // Strawberry Pink
    highlight: '#fecdd3'
  }
};

const PIECE_KEYS = Object.keys(TETROMINOES);

// Scoring rules (100 for 1, 300 for 2, 500 for 3, 800 for 4)
const LINE_POINTS = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

const GameStatus = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

/* ============================================================================
   2. CHEERFUL AUDIO SYNTHESIZER
   ============================================================================ */
class PlayfulAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playChime(freq, duration = 0.12, type = 'sine', volume = 0.12) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + duration);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playMove() {
    this.playChime(420, 0.07, 'sine', 0.06);
  }

  playRotate() {
    this.playChime(520, 0.08, 'sine', 0.08);
    setTimeout(() => this.playChime(640, 0.08, 'sine', 0.08), 35);
  }

  playDrop() {
    this.playChime(260, 0.09, 'triangle', 0.09);
  }

  playHardDrop() {
    this.playChime(190, 0.14, 'triangle', 0.14);
    setTimeout(() => this.playChime(320, 0.12, 'sine', 0.09), 40);
  }

  playHold() {
    this.playChime(480, 0.1, 'sine', 0.08);
    setTimeout(() => this.playChime(600, 0.1, 'sine', 0.08), 50);
  }

  playLineClear(isTetris = false) {
    if (this.muted || !this.ctx) return;
    if (isTetris) {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playChime(freq, 0.24, 'sine', 0.14), i * 75);
      });
    } else {
      [587.33, 739.99, 880].forEach((freq, i) => {
        setTimeout(() => this.playChime(freq, 0.16, 'sine', 0.1), i * 65);
      });
    }
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    [440, 392, 349.23, 293.66].forEach((freq, i) => {
      setTimeout(() => this.playChime(freq, 0.26, 'triangle', 0.1), i * 110);
    });
  }
}

const sfx = new PlayfulAudio();

/* ============================================================================
   3. CELEBRATION PARTICLES SYSTEM
   ============================================================================ */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.colors = ['#ff4d6d', '#ffbe0b', '#00e5ff', '#06d6a0', '#ff7b00', '#a370f7', '#ffffff'];
  }

  resize(width, height, dpr) {
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  spawnLineBurst(rowY, blockSize, count = 28) {
    const yPos = rowY * blockSize + blockSize / 2;
    for (let i = 0; i < count; i++) {
      const isStar = Math.random() > 0.4;
      this.particles.push({
        x: Math.random() * (COLS * blockSize),
        y: yPos + (Math.random() - 0.5) * (blockSize * 0.5),
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 2,
        size: Math.random() * 5 + 3,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.02,
        isStar
      });
    }
  }

  spawnMegaTetrisBurst(width, height) {
    for (let i = 0; i < 70; i++) {
      const isStar = Math.random() > 0.3;
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.7) + 30,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 7 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.015,
        isStar
      });
    }
  }

  updateAndDraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.particles.length === 0) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      if (p.isStar) {
        this.drawStar(this.ctx, 0, 0, 5, p.size, p.size / 2, p.color);
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      }

      this.ctx.restore();
    }
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/* ============================================================================
   4. LOGICAL GAME STATE
   ============================================================================ */
class GameState {
  constructor() {
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;

    this.score = 0;
    this.highScore = this.loadHighScore();
    this.level = 1;
    this.linesCleared = 0;
    this.status = GameStatus.IDLE;

    this.bag = [];
  }

  createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('webtetris_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('webtetris_high_score', this.highScore.toString());
      } catch (e) {}
    }
  }

  reset() {
    this.board = this.createEmptyBoard();
    this.bag = [];
    this.currentPiece = this.getNewPiece();
    this.nextPiece = this.getNewPiece();
    this.holdPiece = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.status = GameStatus.PLAYING;
  }

  getNextPieceType() {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_KEYS];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  getNewPiece() {
    const type = this.getNextPieceType();
    const def = TETROMINOES[type];
    return {
      type,
      matrix: def.shape.map(row => [...row]),
      color: def.color,
      highlight: def.highlight,
      x: Math.floor((COLS - def.shape[0].length) / 2),
      y: 0
    };
  }

  getDropInterval() {
    return Math.max(80, 1000 - (this.level - 1) * 90);
  }

  updateLevelAndScore(clearedCount) {
    if (clearedCount > 0) {
      const points = LINE_POINTS[clearedCount] || (clearedCount * 100);
      this.score += points;
      this.linesCleared += clearedCount;
      this.saveHighScore();

      const newLevel = Math.floor(this.score / 1000) + 1;
      this.level = newLevel;
    }
  }

  checkCollision(piece, offsetX = 0, offsetY = 0, testMatrix = null) {
    const matrix = testMatrix || piece.matrix;
    const targetX = piece.x + offsetX;
    const targetY = piece.y + offsetY;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardX = targetX + c;
          const boardY = targetY + r;

          if (boardX < 0 || boardX >= COLS) return true;
          if (boardY >= ROWS) return true;
          if (boardY < 0) continue;
          if (this.board[boardY][boardX] !== 0) return true;
        }
      }
    }
    return false;
  }

  rotateCurrentPiece() {
    if (!this.currentPiece || this.status !== GameStatus.PLAYING) return false;
    if (this.currentPiece.type === 'O') return false;

    const originalMatrix = this.currentPiece.matrix;
    const rotated = originalMatrix[0].map((_, colIndex) =>
      originalMatrix.map(row => row[colIndex]).reverse()
    );

    const kickOffsets = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: -1 }
    ];

    for (const offset of kickOffsets) {
      if (!this.checkCollision(this.currentPiece, offset.x, offset.y, rotated)) {
        this.currentPiece.matrix = rotated;
        this.currentPiece.x += offset.x;
        this.currentPiece.y += offset.y;
        sfx.playRotate();
        return true;
      }
    }
    return false;
  }

  moveCurrentPiece(dx) {
    if (!this.currentPiece || this.status !== GameStatus.PLAYING) return false;
    if (!this.checkCollision(this.currentPiece, dx, 0)) {
      this.currentPiece.x += dx;
      sfx.playMove();
      return true;
    }
    return false;
  }

  softDrop() {
    if (!this.currentPiece || this.status !== GameStatus.PLAYING) return false;
    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      this.score += 1;
      this.saveHighScore();
      return true;
    } else {
      this.lockCurrentPiece();
      return false;
    }
  }

  hardDrop() {
    if (!this.currentPiece || this.status !== GameStatus.PLAYING) return;
    let dropDistance = 0;
    while (!this.checkCollision(this.currentPiece, 0, dropDistance + 1)) {
      dropDistance++;
    }
    this.currentPiece.y += dropDistance;
    this.score += dropDistance * 2;
    this.saveHighScore();
    sfx.playHardDrop();
    this.lockCurrentPiece();
  }

  hold() {
    if (!this.canHold || !this.currentPiece || this.status !== GameStatus.PLAYING) return;

    sfx.playHold();
    const currentType = this.currentPiece.type;

    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.getNewPiece();
    } else {
      const tempType = this.holdPiece;
      this.holdPiece = currentType;
      const def = TETROMINOES[tempType];
      this.currentPiece = {
        type: tempType,
        matrix: def.shape.map(row => [...row]),
        color: def.color,
        highlight: def.highlight,
        x: Math.floor((COLS - def.shape[0].length) / 2),
        y: 0
      };
    }

    this.canHold = false;
  }

  getGhostPosition() {
    if (!this.currentPiece) return null;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
      ghostY++;
    }
    return {
      x: this.currentPiece.x,
      y: ghostY,
      matrix: this.currentPiece.matrix,
      color: this.currentPiece.color
    };
  }

  lockCurrentPiece() {
    const { matrix, x, y, color } = this.currentPiece;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardY = y + r;
          const boardX = x + c;

          if (boardY < 0) {
            this.gameOver();
            return;
          }
          this.board[boardY][boardX] = color;
        }
      }
    }

    sfx.playDrop();

    const cleared = this.clearLines();
    if (cleared > 0) {
      sfx.playLineClear(cleared === 4);
      this.updateLevelAndScore(cleared);
      ui.triggerBanner(cleared);
      if (cleared === 4) {
        particles.spawnMegaTetrisBurst(game.renderer.width, game.renderer.height);
      }
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNewPiece();
    this.canHold = true;

    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver();
    }
  }

  clearLines() {
    let linesCleared = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
      const isFull = this.board[r].every(cell => cell !== 0);
      if (isFull) {
        linesCleared++;
        particles.spawnLineBurst(r, game.renderer.blockSize, 24);
        this.board.splice(r, 1);
        this.board.unshift(Array(COLS).fill(0));
        r++;
      }
    }

    return linesCleared;
  }

  gameOver() {
    this.status = GameStatus.GAME_OVER;
    sfx.playGameOver();
    this.saveHighScore();
    ui.showGameOver();
  }
}

/* ============================================================================
   5. RESPONSIVE CANVAS RENDERER (Fluid Block Scaling & Dual Previews)
   ============================================================================ */
class ResponsiveCanvasRenderer {
  constructor(container, canvas, nextCanvas, holdCanvas, holdCanvasMobile) {
    this.container = container;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');
    this.holdCanvas = holdCanvas;
    this.holdCtx = holdCanvas?.getContext('2d');
    this.holdCanvasMobile = holdCanvasMobile;
    this.holdCtxMobile = holdCanvasMobile?.getContext('2d');

    this.blockSize = 30;
    this.width = 300;
    this.height = 600;

    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.container.getBoundingClientRect();

    // Responsive sizing matching container exactly
    const targetHeight = Math.max(260, Math.floor(rect.height || 600));
    const targetWidth = Math.floor(targetHeight / 2); // 1:2 aspect ratio

    this.width = targetWidth;
    this.height = targetHeight;
    this.blockSize = targetHeight / ROWS;

    // Set pixel dimensions with Retina HiDPI scale
    this.canvas.width = Math.floor(targetWidth * dpr);
    this.canvas.height = Math.floor(targetHeight * dpr);
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    // Particle canvas resize
    if (particles) {
      particles.resize(targetWidth, targetHeight, dpr);
    }

    // Resize Next Preview canvas
    const nextRect = this.nextCanvas.parentElement.getBoundingClientRect();
    const nextSize = Math.max(60, Math.floor(nextRect.width || 100));
    this.nextCanvas.width = nextSize * dpr;
    this.nextCanvas.height = nextSize * dpr;
    this.nextCtx.resetTransform?.();
    this.nextCtx.scale(dpr, dpr);
    this.nextSize = nextSize;

    // Resize Desktop Hold Canvas
    if (this.holdCanvas) {
      const holdRect = this.holdCanvas.parentElement.getBoundingClientRect();
      const holdSize = Math.max(60, Math.floor(holdRect.width || 100));
      this.holdCanvas.width = holdSize * dpr;
      this.holdCanvas.height = holdSize * dpr;
      this.holdCtx.resetTransform?.();
      this.holdCtx.scale(dpr, dpr);
      this.holdSize = holdSize;
    }

    // Resize Mobile Hold Canvas
    if (this.holdCanvasMobile) {
      const holdMobRect = this.holdCanvasMobile.parentElement.getBoundingClientRect();
      const holdMobSize = Math.max(50, Math.floor(holdMobRect.width || 70));
      this.holdCanvasMobile.width = holdMobSize * dpr;
      this.holdCanvasMobile.height = holdMobSize * dpr;
      this.holdCtxMobile.resetTransform?.();
      this.holdCtxMobile.scale(dpr, dpr);
      this.holdMobSize = holdMobSize;
    }
  }

  render(gameState) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawPlayfulGrid();
    this.drawBoard(gameState.board);

    if (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.PAUSED) {
      const ghost = gameState.getGhostPosition();
      if (ghost && gameState.status === GameStatus.PLAYING) {
        this.drawGhostPiece(ghost);
      }

      if (gameState.currentPiece) {
        this.drawPiece(gameState.currentPiece, this.ctx, this.blockSize);
      }
    }

    // Previews
    this.renderPreview(gameState.nextPiece, this.nextCtx, this.nextSize || 90, this.nextSize || 90);

    // Render both Desktop and Mobile Hold previews
    if (this.holdCtx && this.holdSize) {
      this.renderHold(gameState.holdPiece, this.holdCtx, this.holdSize, this.holdSize);
    }
    if (this.holdCtxMobile && this.holdMobSize) {
      this.renderHold(gameState.holdPiece, this.holdCtxMobile, this.holdMobSize, this.holdMobSize);
    }
  }

  drawPlayfulGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;

    for (let c = 1; c < COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.blockSize, 0);
      this.ctx.lineTo(c * this.blockSize, this.height);
      this.ctx.stroke();
    }

    for (let r = 1; r < ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.blockSize);
      this.ctx.lineTo(this.width, r * this.blockSize);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawBoard(board) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board[r][c];
        if (color !== 0) {
          this.drawCandyBlock(this.ctx, c * this.blockSize, r * this.blockSize, this.blockSize, color);
        }
      }
    }
  }

  drawPiece(piece, context, size) {
    const { matrix, x, y, color } = piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          this.drawCandyBlock(context, (x + c) * size, (y + r) * size, size, color);
        }
      }
    }
  }

  drawGhostPiece(ghost) {
    const { matrix, x, y, color } = ghost;
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const px = (x + c) * this.blockSize + 1.5;
          const py = (y + r) * this.blockSize + 1.5;
          const s = this.blockSize - 3;

          this.drawRoundedRect(this.ctx, px, py, s, s, Math.max(3, s * 0.2));
          this.ctx.fill();
          this.ctx.stroke();
        }
      }
    }
    this.ctx.restore();
  }

  drawCandyBlock(ctx, x, y, size, color) {
    ctx.save();
    const pad = Math.max(1, size * 0.05);
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;
    const radius = Math.max(3, bs * 0.22);

    // Base rounded pill
    this.drawRoundedRect(ctx, bx, by, bs, bs, radius);
    ctx.fillStyle = color;
    ctx.fill();

    // 3D shadow bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    this.drawRoundedRect(ctx, bx + 1, by + bs - Math.max(2, bs * 0.16), bs - 2, Math.max(2, bs * 0.14), 2);
    ctx.fill();

    // Glossy top shine capsule
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    this.drawRoundedRect(ctx, bx + 2, by + 2, bs - 4, (bs - 4) * 0.4, Math.max(2, radius * 0.6));
    ctx.fill();

    // Sparkling corner dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(bx + bs - Math.max(3, bs * 0.2), by + Math.max(3, bs * 0.2), Math.max(1, bs * 0.07), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  renderPreview(piece, ctx, boxWidth, boxHeight) {
    ctx.clearRect(0, 0, boxWidth, boxHeight);
    if (!piece) return;

    const matrix = piece.matrix;
    const blockSize = Math.max(12, Math.min(22, Math.floor(boxWidth / 5)));
    const pieceWidth = matrix[0].length * blockSize;
    const pieceHeight = matrix.length * blockSize;
    const offsetX = Math.floor((boxWidth - pieceWidth) / 2);
    const offsetY = Math.floor((boxHeight - pieceHeight) / 2);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          this.drawCandyBlock(ctx, offsetX + c * blockSize, offsetY + r * blockSize, blockSize, piece.color);
        }
      }
    }
  }

  renderHold(pieceType, ctx, boxWidth, boxHeight) {
    ctx.clearRect(0, 0, boxWidth, boxHeight);
    if (!pieceType) return;

    const def = TETROMINOES[pieceType];
    const matrix = def.shape;
    const blockSize = Math.max(12, Math.min(22, Math.floor(boxWidth / 5)));
    const pieceWidth = matrix[0].length * blockSize;
    const pieceHeight = matrix.length * blockSize;
    const offsetX = Math.floor((boxWidth - pieceWidth) / 2);
    const offsetY = Math.floor((boxHeight - pieceHeight) / 2);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          this.drawCandyBlock(ctx, offsetX + c * blockSize, offsetY + r * blockSize, blockSize, def.color);
        }
      }
    }
  }
}

/* ============================================================================
   6. UI CONTROLLER & OVERLAYS MANAGEMENT
   ============================================================================ */
class UIController {
  constructor() {
    this.scoreElem = document.getElementById('score-display');
    this.highScoreElem = document.getElementById('highscore-display');
    this.levelElem = document.getElementById('level-display');
    this.speedElem = document.getElementById('speed-indicator');
    this.progressFillElem = document.getElementById('level-progress-fill');
    this.linesElem = document.getElementById('lines-display');
    this.linesElemMobile = document.getElementById('lines-display-mobile');

    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameOverOverlay = document.getElementById('gameover-overlay');

    this.finalScoreElem = document.getElementById('final-score');
    this.finalLevelElem = document.getElementById('final-level');
    this.finalLinesElem = document.getElementById('final-lines');

    this.floatingBanner = document.getElementById('floating-banner');
    this.bannerTimeout = null;
  }

  update(state) {
    this.scoreElem.textContent = state.score.toLocaleString();
    this.highScoreElem.textContent = state.highScore.toLocaleString();
    this.levelElem.textContent = state.level;
    
    if (this.linesElem) this.linesElem.textContent = state.linesCleared;
    if (this.linesElemMobile) this.linesElemMobile.textContent = state.linesCleared;

    const speedLabels = {
      1: 'Cruising! 🎈',
      2: 'Zippy! ⚡',
      3: 'Breezy! 🚀',
      4: 'Speedy! 🌟',
      5: 'Hyper! 💫'
    };
    if (this.speedElem) {
      this.speedElem.textContent = speedLabels[state.level] || 'Super Sonic! 🛸';
    }

    const progressPercent = ((state.score % 1000) / 1000) * 100;
    if (this.progressFillElem) {
      this.progressFillElem.style.width = `${progressPercent}%`;
    }
  }

  showStart() {
    this.startOverlay.classList.remove('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
  }

  hideStart() {
    this.startOverlay.classList.add('hidden');
  }

  showPause() {
    this.pauseOverlay.classList.remove('hidden');
  }

  hidePause() {
    this.pauseOverlay.classList.add('hidden');
  }

  showGameOver() {
    this.finalScoreElem.textContent = game.state.score.toLocaleString();
    this.finalLevelElem.textContent = game.state.level;
    this.finalLinesElem.textContent = game.state.linesCleared;
    this.gameOverOverlay.classList.remove('hidden');
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('hidden');
  }

  triggerBanner(lines) {
    if (!this.floatingBanner) return;
    clearTimeout(this.bannerTimeout);

    const labels = {
      1: 'YAY! +100 ⭐',
      2: 'AWESOME! +300 🌈',
      3: 'SUPER COMBO! +500 🚀',
      4: 'MEGA TETRIS! +800 ★🎉'
    };

    this.floatingBanner.textContent = labels[lines] || `+${lines * 100} ✨`;
    this.floatingBanner.classList.remove('hidden');

    void this.floatingBanner.offsetWidth;

    this.bannerTimeout = setTimeout(() => {
      this.floatingBanner.classList.add('hidden');
    }, 1200);
  }
}

/* ============================================================================
   7. CLOUDFLARE WORKERS & KV INTEGRATION HOOK
   ============================================================================ */
async function submitHighscore(playerName, score) {
  const sanitizedName = (playerName || 'Star Player').trim().slice(0, 15);
  const payload = {
    playerName: sanitizedName,
    score: score,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || `Hooray! ${sanitizedName} joined the Star Hall of Fame! 🌟`
    };
  } catch (err) {
    return {
      success: true,
      message: `Yay! Score recorded for ${sanitizedName}! 🎈 (Connect Cloudflare Worker + KV for global ranking)`
    };
  }
}

/* ============================================================================
   8. MAIN GAME CONTROLLER & REQUESTANIMATIONFRAME LOOP
   ============================================================================ */
class TetrisGame {
  constructor() {
    this.state = new GameState();
    this.container = document.getElementById('canvas-container');
    this.canvas = document.getElementById('tetris-canvas');
    this.nextCanvas = document.getElementById('next-canvas');
    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCanvasMobile = document.getElementById('hold-canvas-mobile');

    this.renderer = new ResponsiveCanvasRenderer(
      this.container,
      this.canvas,
      this.nextCanvas,
      this.holdCanvas,
      this.holdCanvasMobile
    );
    this.ui = new UIController();

    this.lastTime = 0;
    this.dropCounter = 0;
    this.animationFrameId = null;

    this.bindEvents();
    this.ui.showStart();
    this.renderer.render(this.state);
  }

  start() {
    sfx.init();
    this.state.reset();
    this.ui.hideStart();
    this.ui.hidePause();
    this.ui.hideGameOver();
    this.lastTime = performance.now();
    this.dropCounter = 0;
    this.loop(this.lastTime);
  }

  pause() {
    if (this.state.status === GameStatus.PLAYING) {
      this.state.status = GameStatus.PAUSED;
      this.ui.showPause();
    } else if (this.state.status === GameStatus.PAUSED) {
      this.resume();
    }
  }

  resume() {
    if (this.state.status === GameStatus.PAUSED) {
      this.state.status = GameStatus.PLAYING;
      this.ui.hidePause();
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  restart() {
    this.start();
  }

  loop(time = 0) {
    if (this.state.status !== GameStatus.PLAYING) {
      this.renderer.render(this.state);
      this.ui.update(this.state);
      particles.updateAndDraw();
      return;
    }

    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;

    const dropInterval = this.state.getDropInterval();

    if (this.dropCounter > dropInterval) {
      this.state.softDrop();
      this.dropCounter = 0;
    }

    this.renderer.render(this.state);
    this.ui.update(this.state);
    particles.updateAndDraw();

    this.animationFrameId = requestAnimationFrame(t => this.loop(t));
  }

  bindEvents() {
    // Window Resize with Debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderer.resize();
        this.renderer.render(this.state);
      }, 100);
    });

    // Desktop Keydown
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (this.state.status === GameStatus.PLAYING) {
        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            this.state.moveCurrentPiece(-1);
            break;

          case 'ArrowRight':
          case 'd':
          case 'D':
            this.state.moveCurrentPiece(1);
            break;

          case 'ArrowUp':
          case 'w':
          case 'W':
            this.state.rotateCurrentPiece();
            break;

          case 'ArrowDown':
          case 's':
          case 'S':
            this.state.softDrop();
            this.dropCounter = 0;
            break;

          case ' ':
            this.state.hardDrop();
            this.dropCounter = 0;
            break;

          case 'c':
          case 'C':
          case 'Shift':
            this.state.hold();
            break;

          case 'p':
          case 'P':
          case 'Escape':
            this.pause();
            break;

          case 'm':
          case 'M':
            this.toggleAudio();
            break;
        }
      } else if (this.state.status === GameStatus.PAUSED) {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          this.resume();
        }
      }
    });

    // UI Buttons
    document.getElementById('start-game-btn').addEventListener('click', () => this.start());
    document.getElementById('resume-game-btn').addEventListener('click', () => this.resume());
    document.getElementById('restart-from-pause-btn').addEventListener('click', () => this.restart());
    document.getElementById('play-again-btn').addEventListener('click', () => this.restart());

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => this.pause());

    const audioBtn = document.getElementById('audio-toggle-btn');
    audioBtn.addEventListener('click', () => this.toggleAudio());

    // Mobile Touch Controls
    const bindTouch = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = (e) => {
        e.preventDefault();
        sfx.init();
        action();
      };
      el.addEventListener('touchstart', handler, { passive: false });
      el.addEventListener('click', handler);
    };

    bindTouch('touch-left', () => this.state.moveCurrentPiece(-1));
    bindTouch('touch-right', () => this.state.moveCurrentPiece(1));
    bindTouch('touch-rotate', () => this.state.rotateCurrentPiece());
    bindTouch('touch-down', () => {
      this.state.softDrop();
      this.dropCounter = 0;
    });
    bindTouch('touch-hard-drop', () => {
      this.state.hardDrop();
      this.dropCounter = 0;
    });
    bindTouch('touch-hold', () => this.state.hold());

    // Leaderboard Form
    const submitBtn = document.getElementById('submit-score-btn');
    const nameInput = document.getElementById('player-name-input');
    const feedbackMsg = document.getElementById('leaderboard-feedback');

    submitBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim() || 'Hero Player';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving... ✨';

      feedbackMsg.className = 'status-msg';
      feedbackMsg.textContent = 'Connecting to Star Leaderboard...';
      feedbackMsg.classList.remove('hidden');

      const result = await submitHighscore(name, this.state.score);

      feedbackMsg.textContent = result.message;
      feedbackMsg.classList.add(result.success ? 'success' : 'error');
      submitBtn.textContent = 'Saved! ⭐';
    });
  }

  toggleAudio() {
    const isMuted = sfx.toggleMute();
    const icon = document.getElementById('audio-icon');
    if (icon) {
      icon.textContent = isMuted ? '🔇' : '🔊';
    }
  }
}

// Global Instances
let game;
let ui;
let particles;

window.addEventListener('DOMContentLoaded', () => {
  const particleCanvas = document.getElementById('particles-canvas');
  particles = new ParticleSystem(particleCanvas);
  game = new TetrisGame();
  ui = game.ui;
});
