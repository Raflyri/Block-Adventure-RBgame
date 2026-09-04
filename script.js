/**
 * ============================================================================
 * RBlock Adventure - Fun Responsive Child-Friendly Arcade Edition
 * Featuring 1x1 Tactical Candy Bomb, Dynamic Fuse Timer, Block Shatter VFX,
 * and Direct On-Screen Touch Drag/Swipe Gestures on Canvas
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. CONSTANTS & CANDY TETROMINO DEFINITIONS
   ============================================================================ */
const COLS = 10;
const ROWS = 20;

// Cheerful Candy-Colored Tetrominoes + 1x1 Tactical Candy Bomb
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00e5ff',
    highlight: '#a7f3d0'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#4361ee',
    highlight: '#93c5fd'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff7b00',
    highlight: '#fed7aa'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffbe0b',
    highlight: '#fef08a'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#06d6a0',
    highlight: '#bbf7d0'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a370f7',
    highlight: '#e9d5ff'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff4d6d',
    highlight: '#fecdd3'
  },
  BOMB: {
    // 1x1 Compact Tactical Bomb Block
    shape: [
      [1]
    ],
    color: '#ff2a2a',
    highlight: '#ff9999',
    isBomb: true
  }
};

const CLASSIC_PIECE_KEYS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Scoring rules
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
   2. PUNCHY ARCADE AUDIO SYNTHESIZER
   ============================================================================ */
class PlayfulAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.noiseBuffer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.createNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
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
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + duration);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playMove() {
    this.playChime(420, 0.06, 'sine', 0.05);
  }

  playRotate() {
    this.playChime(540, 0.07, 'sine', 0.07);
    setTimeout(() => this.playChime(680, 0.07, 'sine', 0.07), 30);
  }

  playDrop() {
    this.playChime(240, 0.08, 'triangle', 0.08);
  }

  playHardDrop() {
    this.playChime(150, 0.15, 'triangle', 0.18);
    this.playChime(80, 0.2, 'sine', 0.2);
  }

  playHold() {
    this.playChime(480, 0.09, 'sine', 0.08);
    setTimeout(() => this.playChime(620, 0.09, 'sine', 0.08), 40);
  }

  playFuseTick(isUrgent = false) {
    if (this.muted || !this.ctx) return;
    const freq = isUrgent ? 880 : 520;
    this.playChime(freq, 0.04, 'triangle', isUrgent ? 0.1 : 0.06);
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.5);

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.45);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.45);
      }
    } catch (e) {}
  }

  playShatter() {
    if (this.muted || !this.ctx) return;
    const freqs = [1200, 1650, 2100, 2800];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq + Math.random() * 200, 0.08, 'sine', 0.05);
      }, idx * 25);
    });
  }

  playLineClear(isMega = false) {
    if (this.muted || !this.ctx) return;
    this.playShatter();
    if (isMega) {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playChime(freq, 0.22, 'sine', 0.14), i * 75);
      });
    } else {
      [587.33, 739.99, 880].forEach((freq, i) => {
        setTimeout(() => this.playChime(freq, 0.15, 'sine', 0.1), i * 65);
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
   3. CELEBRATION & EXPLOSION PARTICLES SYSTEM
   ============================================================================ */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.shockwaves = [];
  }

  resize(width, height, dpr) {
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  spawnLineBurst(rowY, blockSize, rowColors = []) {
    const yPos = rowY * blockSize + blockSize / 2;
    const count = 35;

    for (let i = 0; i < count; i++) {
      const isStar = Math.random() > 0.45;
      const color = rowColors.length ? rowColors[Math.floor(Math.random() * rowColors.length)] : '#ffbe0b';

      this.particles.push({
        x: Math.random() * (COLS * blockSize),
        y: yPos + (Math.random() - 0.5) * (blockSize * 0.6),
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 6 + 4,
        color: color || '#ffbe0b',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.02,
        isStar,
        type: 'debris'
      });
    }
  }

  spawnBombExplosion(centerX, centerY) {
    this.shockwaves.push({
      x: centerX,
      y: centerY,
      radius: 8,
      maxRadius: 110,
      alpha: 1,
      speed: 7
    });

    const fireColors = ['#ff2a2a', '#ff7b00', '#ffbe0b', '#ffffff', '#ff4d6d'];
    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.02,
        isStar: Math.random() > 0.4,
        type: 'fire'
      });
    }

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.8;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 16,
        y: centerY + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        size: Math.random() * 14 + 8,
        color: 'rgba(230, 210, 255, 0.4)',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        alpha: 0.8,
        decay: 0.025,
        type: 'smoke'
      });
    }
  }

  spawnMegaRBlockBurst(width, height) {
    const rainbow = ['#00e5ff', '#4361ee', '#ff7b00', '#ffbe0b', '#06d6a0', '#a370f7', '#ff4d6d', '#ffffff'];
    for (let i = 0; i < 75; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.6) + 30,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 3,
        size: Math.random() * 8 + 4,
        color: rainbow[Math.floor(Math.random() * rainbow.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.015,
        isStar: Math.random() > 0.35,
        type: 'debris'
      });
    }
  }

  updateAndDraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= 0.045;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.lineWidth = Math.max(2, (1 - sw.radius / sw.maxRadius) * 7);
      this.ctx.strokeStyle = `rgba(255, 220, 100, ${sw.alpha})`;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius * 0.85, 0, Math.PI * 2);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = `rgba(255, 77, 109, ${sw.alpha * 0.6})`;
      this.ctx.stroke();
      this.ctx.restore();
    }

    if (this.particles.length === 0) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.type === 'smoke' ? -0.05 : 0.18;
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

      if (p.type === 'smoke') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.isStar) {
        this.drawStar(this.ctx, 0, 0, 5, p.size, p.size / 2, p.color);
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
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
   4. LOGICAL GAME STATE (RBlock Engine)
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
    this.comboStreak = 0;
    this.status = GameStatus.IDLE;

    this.bag = [];
    this.piecesSinceLastBomb = 0;

    this.bombFuseDuration = 8000;
    this.bombFuseRemaining = 8000;
    this.lastTickSecond = 8;
  }

  createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('rblock_adventure_highscore') || localStorage.getItem('webtetris_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('rblock_adventure_highscore', this.highScore.toString());
      } catch (e) {}
    }
  }

  reset() {
    this.board = this.createEmptyBoard();
    this.bag = [];
    this.piecesSinceLastBomb = 0;
    this.comboStreak = 0;
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.status = GameStatus.PLAYING;

    this.currentPiece = this.getNewPiece();
    this.nextPiece = this.getNewPiece();
    this.holdPiece = null;
    this.canHold = true;

    this.initBombFuseIfActive();
  }

  getBombFuseDurationForLevel(level) {
    switch (level) {
      case 1: return 8000;
      case 2: return 6500;
      case 3: return 5000;
      case 4: return 4000;
      default: return Math.max(2500, 3500 - (level - 5) * 200);
    }
  }

  initBombFuseIfActive() {
    if (this.currentPiece && this.currentPiece.isBomb) {
      this.bombFuseDuration = this.getBombFuseDurationForLevel(this.level);
      this.bombFuseRemaining = this.bombFuseDuration;
      this.lastTickSecond = Math.ceil(this.bombFuseRemaining / 1000);
      sfx.playFuseTick(false);
    }
  }

  getNextPieceType() {
    this.piecesSinceLastBomb++;

    if (this.piecesSinceLastBomb >= 16) {
      const chance = this.piecesSinceLastBomb >= 24 ? 1.0 : 0.25;
      if (Math.random() < chance) {
        this.piecesSinceLastBomb = 0;
        return 'BOMB';
      }
    }

    if (this.bag.length === 0) {
      this.bag = [...CLASSIC_PIECE_KEYS];
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
      isBomb: !!def.isBomb,
      x: Math.floor((COLS - def.shape[0].length) / 2),
      y: 0
    };
  }

  getDropInterval() {
    return Math.max(80, 1000 - (this.level - 1) * 90);
  }

  updateLevelAndScore(clearedCount) {
    if (clearedCount > 0) {
      this.comboStreak++;
      const basePoints = LINE_POINTS[clearedCount] || (clearedCount * 100);
      const comboBonus = (this.comboStreak - 1) * 50;
      const points = basePoints + comboBonus;

      this.score += points;
      this.linesCleared += clearedCount;
      this.saveHighScore();

      const newLevel = Math.floor(this.score / 1000) + 1;
      this.level = newLevel;
    } else {
      this.comboStreak = 0;
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
    if (this.currentPiece.type === 'O' || this.currentPiece.isBomb) return false;

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
    game.triggerScreenShake(false);
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
        isBomb: !!def.isBomb,
        x: Math.floor((COLS - def.shape[0].length) / 2),
        y: 0
      };
    }

    this.canHold = false;
    this.initBombFuseIfActive();
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
      color: this.currentPiece.color,
      isBomb: this.currentPiece.isBomb
    };
  }

  lockCurrentPiece() {
    if (this.currentPiece.isBomb) {
      this.detonateBomb(this.currentPiece.x, this.currentPiece.y);
      return;
    }

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
      ui.triggerBanner(cleared, this.comboStreak);
      if (cleared === 4) {
        particles.spawnMegaRBlockBurst(game.renderer.width, game.renderer.height);
        game.triggerScreenShake(true);
      }
    } else {
      this.comboStreak = 0;
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNewPiece();
    this.canHold = true;
    this.initBombFuseIfActive();

    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver();
    }
  }

  detonateBomb(centerX, centerY) {
    sfx.playExplosion();
    game.triggerScreenShake(true);

    const pixelX = centerX * game.renderer.blockSize + game.renderer.blockSize / 2;
    const pixelY = centerY * game.renderer.blockSize + game.renderer.blockSize / 2;
    particles.spawnBombExplosion(pixelX, pixelY);

    let destroyedCount = 0;
    const radius = 1; // 3x3 surrounding grid

    for (let r = centerY - radius; r <= centerY + radius; r++) {
      for (let c = centerX - radius; c <= centerX + radius; c++) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          if (this.board[r][c] !== 0) {
            destroyedCount++;
            this.board[r][c] = 0;
          }
        }
      }
    }

    this.collapseFloatingBlocks();

    const blastBonus = 250 + destroyedCount * 45;
    this.score += blastBonus;
    this.saveHighScore();
    ui.triggerBombBanner(blastBonus, destroyedCount);

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNewPiece();
    this.canHold = true;
    this.initBombFuseIfActive();

    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver();
    }
  }

  collapseFloatingBlocks() {
    for (let c = 0; c < COLS; c++) {
      let emptyY = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.board[r][c] !== 0) {
          if (r !== emptyY) {
            this.board[emptyY][c] = this.board[r][c];
            this.board[r][c] = 0;
          }
          emptyY--;
        }
      }
    }
  }

  clearLines() {
    let linesCleared = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
      const isFull = this.board[r].every(cell => cell !== 0);
      if (isFull) {
        linesCleared++;
        const rowColors = this.board[r].filter(c => c !== 0);
        particles.spawnLineBurst(r, game.renderer.blockSize, rowColors);
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
   5. RESPONSIVE CANVAS RENDERER
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

    const targetHeight = Math.max(260, Math.floor(rect.height || 600));
    const targetWidth = Math.floor(targetHeight / 2);

    this.width = targetWidth;
    this.height = targetHeight;
    this.blockSize = targetHeight / ROWS;

    this.canvas.width = Math.floor(targetWidth * dpr);
    this.canvas.height = Math.floor(targetHeight * dpr);
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    if (particles) {
      particles.resize(targetWidth, targetHeight, dpr);
    }

    const nextRect = this.nextCanvas.parentElement.getBoundingClientRect();
    const nextSize = Math.max(60, Math.floor(nextRect.width || 100));
    this.nextCanvas.width = nextSize * dpr;
    this.nextCanvas.height = nextSize * dpr;
    this.nextCtx.resetTransform?.();
    this.nextCtx.scale(dpr, dpr);
    this.nextSize = nextSize;

    if (this.holdCanvas) {
      const holdRect = this.holdCanvas.parentElement.getBoundingClientRect();
      const holdSize = Math.max(60, Math.floor(holdRect.width || 100));
      this.holdCanvas.width = holdSize * dpr;
      this.holdCanvas.height = holdSize * dpr;
      this.holdCtx.resetTransform?.();
      this.holdCtx.scale(dpr, dpr);
      this.holdSize = holdSize;
    }

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
        this.drawPiece(gameState.currentPiece, this.ctx, this.blockSize, gameState);
      }
    }

    this.renderPreview(gameState.nextPiece, this.nextCtx, this.nextSize || 90, this.nextSize || 90);

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

  drawPiece(piece, context, size, gameState = null) {
    const { matrix, x, y, color, isBomb } = piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          if (isBomb) {
            const fuseSec = gameState ? (gameState.bombFuseRemaining / 1000).toFixed(1) : null;
            this.draw1x1BombBlock(context, (x + c) * size, (y + r) * size, size, fuseSec);
          } else {
            this.drawCandyBlock(context, (x + c) * size, (y + r) * size, size, color);
          }
        }
      }
    }
  }

  drawGhostPiece(ghost) {
    const { matrix, x, y, color, isBomb } = ghost;
    this.ctx.save();
    this.ctx.strokeStyle = isBomb ? '#ff2a2a' : color;
    this.ctx.lineWidth = 1.5;
    this.ctx.fillStyle = isBomb ? 'rgba(255, 42, 42, 0.15)' : 'rgba(255, 255, 255, 0.06)';

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const px = (x + c) * this.blockSize + 1.5;
          const py = (y + r) * this.blockSize + 1.5;
          const s = this.blockSize - 3;

          this.drawRoundedRect(this.ctx, px, py, s, s, Math.max(3, s * 0.22));
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

    this.drawRoundedRect(ctx, bx, by, bs, bs, radius);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    this.drawRoundedRect(ctx, bx + 1, by + bs - Math.max(2, bs * 0.16), bs - 2, Math.max(2, bs * 0.14), 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    this.drawRoundedRect(ctx, bx + 2, by + 2, bs - 4, (bs - 4) * 0.4, Math.max(2, radius * 0.6));
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(bx + bs - Math.max(3, bs * 0.2), by + Math.max(3, bs * 0.2), Math.max(1, bs * 0.07), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  draw1x1BombBlock(ctx, x, y, size, fuseSeconds = null) {
    ctx.save();
    const pad = Math.max(1, size * 0.06);
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;
    const radius = Math.max(4, bs * 0.28);

    const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
    const glowAlpha = 0.45 + pulse * 0.45;

    ctx.shadowColor = `rgba(255, 42, 42, ${glowAlpha})`;
    ctx.shadowBlur = 8 + pulse * 8;

    this.drawRoundedRect(ctx, bx, by, bs, bs, radius);
    ctx.fillStyle = pulse > 0.6 ? '#ff2a2a' : '#cc0000';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#660000';
    ctx.beginPath();
    ctx.arc(bx + bs / 2, by + bs / 2, bs * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pulse > 0.5 ? '#ffff00' : '#ff9900';
    ctx.beginPath();
    ctx.arc(bx + bs * 0.72, by + bs * 0.28, bs * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(bs * 0.55)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', bx + bs / 2, by + bs / 2 + 1);

    if (fuseSeconds !== null) {
      const secNum = parseFloat(fuseSeconds);
      const isUrgent = secNum <= 2.5;

      ctx.font = `bold ${Math.max(10, Math.floor(bs * 0.45))}px 'Fredoka', sans-serif`;
      const text = `⏱️ ${fuseSeconds}s`;
      const textWidth = ctx.measureText(text).width;

      const badgeX = bx + bs / 2;
      const badgeY = by - 8;

      ctx.fillStyle = isUrgent ? 'rgba(255, 42, 42, 0.95)' : 'rgba(20, 10, 40, 0.88)';
      ctx.strokeStyle = isUrgent ? '#ffff00' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;

      this.drawRoundedRect(ctx, badgeX - textWidth / 2 - 4, badgeY - 11, textWidth + 8, 14, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isUrgent ? '#ffffff' : '#ffd129';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, badgeX, badgeY - 4);
    }

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
    const blockSize = piece.isBomb ? Math.floor(boxWidth * 0.4) : Math.max(12, Math.min(22, Math.floor(boxWidth / 5)));
    const pieceWidth = matrix[0].length * blockSize;
    const pieceHeight = matrix.length * blockSize;
    const offsetX = Math.floor((boxWidth - pieceWidth) / 2);
    const offsetY = Math.floor((boxHeight - pieceHeight) / 2);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          if (piece.isBomb) {
            this.draw1x1BombBlock(ctx, offsetX + c * blockSize, offsetY + r * blockSize, blockSize);
          } else {
            this.drawCandyBlock(ctx, offsetX + c * blockSize, offsetY + r * blockSize, blockSize, piece.color);
          }
        }
      }
    }
  }

  renderHold(pieceType, ctx, boxWidth, boxHeight) {
    ctx.clearRect(0, 0, boxWidth, boxHeight);
    if (!pieceType) return;

    const def = TETROMINOES[pieceType];
    const matrix = def.shape;
    const blockSize = def.isBomb ? Math.floor(boxWidth * 0.4) : Math.max(12, Math.min(22, Math.floor(boxWidth / 5)));
    const pieceWidth = matrix[0].length * blockSize;
    const pieceHeight = matrix.length * blockSize;
    const offsetX = Math.floor((boxWidth - pieceWidth) / 2);
    const offsetY = Math.floor((boxHeight - pieceHeight) / 2);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          if (def.isBomb) {
            this.draw1x1BombBlock(ctx, offsetX + c * blockSize, offsetY + r * blockSize, blockSize);
          } else {
            this.drawCandyBlock(ctx, offsetX + c * blockSize, offsetY + r * blockSize, blockSize, def.color);
          }
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
    this.leaderboardOverlay = document.getElementById('leaderboard-overlay');

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
    if (this.leaderboardOverlay) this.leaderboardOverlay.classList.add('hidden');
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

  showLeaderboard() {
    if (this.leaderboardOverlay) this.leaderboardOverlay.classList.remove('hidden');
  }

  hideLeaderboard() {
    if (this.leaderboardOverlay) this.leaderboardOverlay.classList.add('hidden');
  }

  showGameOver() {
    this.finalScoreElem.textContent = game.state.score.toLocaleString();
    this.finalLevelElem.textContent = game.state.level;
    this.finalLinesElem.textContent = game.state.linesCleared;

    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.value = localStorage.getItem('rblock_player_name') || '';
    }
    const feedbackMsg = document.getElementById('leaderboard-feedback');
    if (feedbackMsg) feedbackMsg.classList.add('hidden');
    const submitBtn = document.getElementById('submit-score-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan 🏅';
    }

    this.gameOverOverlay.classList.remove('hidden');
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('hidden');
  }

  triggerBanner(lines, combo = 1) {
    if (!this.floatingBanner) return;
    clearTimeout(this.bannerTimeout);

    const labels = {
      1: combo > 1 ? `${combo}x COMBO! 🔥 +${100 + (combo - 1) * 50}` : 'YAY! +100 ⭐',
      2: combo > 1 ? `${combo}x DOUBLE! ⚡ +${300 + (combo - 1) * 50}` : 'AWESOME! +300 🌈',
      3: 'SUPER COMBO! +500 🚀',
      4: 'MEGA RBLOCK! +800 ★🎉'
    };

    this.floatingBanner.className = 'floating-banner';
    this.floatingBanner.textContent = labels[lines] || `+${lines * 100} ✨`;
    this.floatingBanner.classList.remove('hidden');

    void this.floatingBanner.offsetWidth;

    this.bannerTimeout = setTimeout(() => {
      this.floatingBanner.classList.add('hidden');
    }, 1200);
  }

  triggerBombBanner(bonus, destroyedCount) {
    if (!this.floatingBanner) return;
    clearTimeout(this.bannerTimeout);

    this.floatingBanner.className = 'floating-banner bomb-banner';
    this.floatingBanner.textContent = `BOOM! 💣 +${bonus} (${destroyedCount} Blocks!)`;
    this.floatingBanner.classList.remove('hidden');

    void this.floatingBanner.offsetWidth;

    this.bannerTimeout = setTimeout(() => {
      this.floatingBanner.classList.add('hidden');
    }, 1400);
  }
}

/* ============================================================================
   7. CLOUDFLARE PAGES FUNCTIONS & KV GLOBAL LEADERBOARD SERVICE
   ============================================================================ */
const DEFAULT_LEADERBOARD = [
  { name: "RB_Master", score: 12500, date: "2026-09-01T12:00:00.000Z" },
  { name: "CandyQueen", score: 9800, date: "2026-09-02T14:30:00.000Z" },
  { name: "JellyStar", score: 7450, date: "2026-09-03T09:15:00.000Z" },
  { name: "SparkyBlock", score: 5200, date: "2026-09-04T08:00:00.000Z" },
  { name: "ChocoBlast", score: 3800, date: "2026-09-04T11:45:00.000Z" },
  { name: "LittleGamer", score: 2500, date: "2026-09-04T15:20:00.000Z" },
  { name: "PixelKid", score: 1600, date: "2026-09-04T16:10:00.000Z" }
];

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

class LeaderboardService {
  static getLocalScores() {
    try {
      const data = localStorage.getItem('rblock_leaderboard_local');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [...DEFAULT_LEADERBOARD];
  }

  static saveLocalScore(name, score) {
    const list = this.getLocalScores();
    list.push({ name, score, date: new Date().toISOString() });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 50);
    try {
      localStorage.setItem('rblock_leaderboard_local', JSON.stringify(trimmed));
    } catch (e) {}
    return trimmed;
  }

  static async fetchScores() {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          return data.leaderboard;
        }
      }
    } catch (err) {
      // Local fallback (e.g. running on simple http server or offline)
    }
    return this.getLocalScores().slice(0, 10);
  }

  static async submitScore(playerName, score) {
    const sanitizedName = (playerName || 'Player').trim().slice(0, 12);
    try {
      localStorage.setItem('rblock_player_name', sanitizedName);
    } catch (e) {}

    // Always persist in local storage fallback
    this.saveLocalScore(sanitizedName, score);

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sanitizedName, score: score })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          rank: data.rank,
          message: data.message || `Luar biasa! Skor ${sanitizedName} tersimpan di Cloudflare KV! 🌟`
        };
      }
    } catch (err) {
      // Network/local server fallback
    }

    return {
      success: true,
      message: `Yay! Skor ${score} dicatat untuk ${sanitizedName}! ⭐ (Tersimpan di rekor lokal)`
    };
  }
}

/* ============================================================================
   8. MAIN GAME CONTROLLER, REQUESTANIMATIONFRAME LOOP & TOUCH GESTURES
   ============================================================================ */
class RBlockGame {
  constructor() {
    this.state = new GameState();
    this.container = document.getElementById('canvas-container');
    this.canvas = document.getElementById('rblock-canvas') || document.querySelector('canvas');
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
    this.shakeTimeout = null;

    this.bindEvents();
    this.setupCanvasTouchGestures();
    this.ui.showStart();
    this.renderer.render(this.state);
  }

  triggerScreenShake(isHeavy = false) {
    if (!this.container) return;
    clearTimeout(this.shakeTimeout);

    this.container.classList.remove('screen-shake', 'soft-shake');
    void this.container.offsetWidth;

    const className = isHeavy ? 'screen-shake' : 'soft-shake';
    this.container.classList.add(className);

    this.shakeTimeout = setTimeout(() => {
      this.container.classList.remove('screen-shake', 'soft-shake');
    }, isHeavy ? 350 : 200);
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

    // Active Bomb Fuse Countdown Logic
    if (this.state.currentPiece && this.state.currentPiece.isBomb) {
      this.state.bombFuseRemaining -= deltaTime;

      const currentSec = Math.ceil(this.state.bombFuseRemaining / 1000);
      if (currentSec !== this.state.lastTickSecond && currentSec > 0) {
        this.state.lastTickSecond = currentSec;
        sfx.playFuseTick(currentSec <= 2);
      }

      if (this.state.bombFuseRemaining <= 0) {
        this.state.detonateBomb(this.state.currentPiece.x, this.state.currentPiece.y);
        this.dropCounter = 0;
      }
    }

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

  // Direct Touch Gestures on Canvas (Swipe, Drag & Tap)
  setupCanvasTouchGestures() {
    if (!this.container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let lastMoveX = 0;
    let lastMoveY = 0;
    let touchStartTime = 0;
    let hasMovedHorizontally = false;

    const onTouchStart = (e) => {
      if (this.state.status !== GameStatus.PLAYING) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      lastMoveX = touch.clientX;
      lastMoveY = touch.clientY;
      touchStartTime = performance.now();
      hasMovedHorizontally = false;
      sfx.init();
    };

    const onTouchMove = (e) => {
      if (this.state.status !== GameStatus.PLAYING) return;
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;

      const deltaX = currentX - lastMoveX;
      const deltaY = currentY - lastMoveY;

      // Move piece horizontally when dragging reaches threshold
      const stepThreshold = Math.max(14, this.renderer.blockSize * 0.7);

      if (Math.abs(deltaX) >= stepThreshold) {
        const dir = deltaX > 0 ? 1 : -1;
        const steps = Math.floor(Math.abs(deltaX) / stepThreshold);
        for (let i = 0; i < steps; i++) {
          this.state.moveCurrentPiece(dir);
        }
        lastMoveX = currentX;
        hasMovedHorizontally = true;
      }

      // Drag downwards: Soft Drop
      if (deltaY >= stepThreshold * 1.3) {
        this.state.softDrop();
        this.dropCounter = 0;
        lastMoveY = currentY;
      }

      e.preventDefault();
    };

    const onTouchEnd = (e) => {
      if (this.state.status !== GameStatus.PLAYING) return;
      const touchDuration = performance.now() - touchStartTime;
      const touch = e.changedTouches[0];
      const totalDistX = Math.abs(touch.clientX - touchStartX);
      const totalDistY = touch.clientY - touchStartY;

      // 1. Fast flick downwards: Super Drop / Hard Drop
      if (totalDistY > 45 && touchDuration < 250 && !hasMovedHorizontally) {
        this.state.hardDrop();
        this.dropCounter = 0;
        e.preventDefault();
        return;
      }

      // 2. Quick Tap: Rotate piece
      if (totalDistX < 14 && Math.abs(totalDistY) < 14 && touchDuration < 240) {
        this.state.rotateCurrentPiece();
        e.preventDefault();
        return;
      }
    };

    this.container.addEventListener('touchstart', onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', onTouchMove, { passive: false });
    this.container.addEventListener('touchend', onTouchEnd, { passive: false });
  }

  bindEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderer.resize();
        this.renderer.render(this.state);
      }, 100);
    });

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
          case 'l':
          case 'L':
            this.openLeaderboard();
            break;
        }
      } else if (this.state.status === GameStatus.PAUSED) {
        if (e.key === 'p' || e.key === 'P') {
          this.resume();
        } else if (e.key === 'Escape') {
          if (this.ui.leaderboardOverlay && !this.ui.leaderboardOverlay.classList.contains('hidden')) {
            this.closeLeaderboard();
          } else {
            this.resume();
          }
        }
      }
    });

    document.getElementById('start-game-btn').addEventListener('click', () => this.start());
    document.getElementById('resume-game-btn').addEventListener('click', () => this.resume());
    document.getElementById('restart-from-pause-btn').addEventListener('click', () => this.restart());
    document.getElementById('play-again-btn').addEventListener('click', () => this.restart());

    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => this.pause());

    const audioBtn = document.getElementById('audio-toggle-btn');
    audioBtn.addEventListener('click', () => this.toggleAudio());

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => this.openLeaderboard());
    }

    const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
    if (closeLeaderboardBtn) {
      closeLeaderboardBtn.addEventListener('click', () => this.closeLeaderboard());
    }

    const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard-btn');
    if (refreshLeaderboardBtn) {
      refreshLeaderboardBtn.addEventListener('click', () => this.loadAndRenderLeaderboard());
    }

    const viewFromGameOverBtn = document.getElementById('view-leaderboard-from-gameover-btn');
    if (viewFromGameOverBtn) {
      viewFromGameOverBtn.addEventListener('click', () => this.openLeaderboard());
    }

    // Mobile Touch Buttons (for hybrid control: buttons + screen drag)
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

    const submitBtn = document.getElementById('submit-score-btn');
    const nameInput = document.getElementById('player-name-input');
    const feedbackMsg = document.getElementById('leaderboard-feedback');

    submitBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim() || 'Hero Player';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan... ✨';

      feedbackMsg.className = 'status-msg';
      feedbackMsg.textContent = 'Menghubungkan ke Cloudflare KV...';
      feedbackMsg.classList.remove('hidden');

      const result = await LeaderboardService.submitScore(name, this.state.score);

      feedbackMsg.textContent = result.message;
      feedbackMsg.classList.add(result.success ? 'success' : 'error');
      submitBtn.textContent = 'Tersimpan! ⭐';
    });
  }

  async openLeaderboard() {
    if (this.state.status === GameStatus.PLAYING) {
      this.pause();
    }
    this.ui.showLeaderboard();
    await this.loadAndRenderLeaderboard();
  }

  closeLeaderboard() {
    this.ui.hideLeaderboard();
  }

  async loadAndRenderLeaderboard() {
    const listElem = document.getElementById('leaderboard-list');
    const loadingElem = document.getElementById('leaderboard-loading');
    if (loadingElem) loadingElem.classList.remove('hidden');
    if (listElem) listElem.innerHTML = '';

    const scores = await LeaderboardService.fetchScores();

    if (loadingElem) loadingElem.classList.add('hidden');
    if (!listElem) return;

    listElem.innerHTML = '';
    scores.forEach((entry, index) => {
      const rank = index + 1;
      const li = document.createElement('li');
      li.className = `leaderboard-item rank-${rank <= 3 ? rank : 'rest'}`;

      let rankBadge = `#${rank}`;
      if (rank === 1) rankBadge = '🥇';
      else if (rank === 2) rankBadge = '🥈';
      else if (rank === 3) rankBadge = '🥉';

      let dateStr = 'Top Rekor';
      if (entry.date) {
        try {
          const d = new Date(entry.date);
          dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {}
      }

      li.innerHTML = `
        <div class="item-left">
          <span class="rank-badge">${rankBadge}</span>
          <div class="player-details">
            <span class="player-name-text">${escapeHtml(entry.name || 'Hero Player')}</span>
            <span class="player-date-text">${dateStr}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="player-score-text">${Number(entry.score || 0).toLocaleString()}</span>
        </div>
      `;
      listElem.appendChild(li);
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
  game = new RBlockGame();
  ui = game.ui;
});
