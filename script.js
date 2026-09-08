/**
 * ============================================================================
 * RBlock Adventure v2.0 - Ultimate Fun Responsive Arcade Edition
 * Features:
 * 1. PWA & 100% Offline Mode with Service Worker
 * 2. Theme & Skin System: Candy Jelly, Cyber Neon, Kawaii Pastel, Retro 8-Bit
 * 3. Multi-Game Modes: Classic Arcade, Daily Challenge (Seeded), Puzzle Stages (10 Levels)
 * 4. Multi-Mode Global Online Leaderboard (Cloudflare Pages Functions & KV)
 * 5. Tactical 1x1 Candy Bomb with Dynamic Fuse Timer
 * 6. Shattered Debris Particle VFX & Web Audio Synthesizer
 * 7. Direct Canvas Touch Swipe/Drag/Tap + On-Screen D-Pad Controls
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. CONSTANTS, THEMES & TETROMINO DEFINITIONS
   ============================================================================ */
const COLS = 10;
const ROWS = 20;

// Game Modes
const GameMode = {
  CLASSIC: 'classic',
  DAILY: 'daily',
  PUZZLE: 'puzzle'
};

// Theme Configurations & Skin Palettes
const THEMES = {
  candy: {
    id: 'candy',
    name: 'Candy Jelly',
    renderStyle: 'glossy',
    badge: '💣 Candy Bomb Edition 💣',
    colors: {
      I: '#00e5ff',
      J: '#4361ee',
      L: '#ff7b00',
      O: '#ffbe0b',
      S: '#06d6a0',
      T: '#a370f7',
      Z: '#ff4d6d',
      BOMB: '#ff2a2a'
    }
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    renderStyle: 'neon',
    badge: '⚡ Cyber Synth Edition ⚡',
    colors: {
      I: '#00f0ff',
      J: '#0066ff',
      L: '#ff5500',
      O: '#ffe600',
      S: '#00ff66',
      T: '#b000ff',
      Z: '#ff007f',
      BOMB: '#ff003c'
    }
  },
  pastel: {
    id: 'pastel',
    name: 'Kawaii Pastel',
    renderStyle: 'pastel',
    badge: '🍃 Sweet Pastel Edition 🍃',
    colors: {
      I: '#81ecec',
      J: '#a29bfe',
      L: '#fab1a0',
      O: '#ffeaa7',
      S: '#a8e6cf',
      T: '#d6a2e8',
      Z: '#ff9ebb',
      BOMB: '#ff7675'
    }
  },
  retro: {
    id: 'retro',
    name: 'Retro 8-Bit',
    renderStyle: 'retro',
    badge: '🕹️ 8-Bit GameBoy Edition 🕹️',
    colors: {
      I: '#9bbc0f',
      J: '#8bac0f',
      L: '#9bbc0f',
      O: '#8bac0f',
      S: '#9bbc0f',
      T: '#8bac0f',
      Z: '#9bbc0f',
      BOMB: '#306230'
    }
  }
};

// Base Tetromino shapes
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
   2. THEME MANAGER (SKINS & VISUALS)
   ============================================================================ */
class ThemeManager {
  static currentTheme = 'candy';

  static init() {
    try {
      const saved = localStorage.getItem('rblock_theme');
      if (saved && THEMES[saved]) {
        this.currentTheme = saved;
      }
    } catch (e) {}
    this.applyTheme(this.currentTheme, false);
  }

  static applyTheme(themeId, save = true) {
    if (!THEMES[themeId]) themeId = 'candy';
    this.currentTheme = themeId;

    document.documentElement.setAttribute('data-theme', themeId);
    if (save) {
      try {
        localStorage.setItem('rblock_theme', themeId);
      } catch (e) {}
    }

    // Update active highlight card in theme modal
    document.querySelectorAll('.theme-card').forEach((card) => {
      if (card.getAttribute('data-theme') === themeId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update header badge
    const subBadge = document.getElementById('header-sub-badge');
    if (subBadge && THEMES[themeId].badge) {
      subBadge.textContent = THEMES[themeId].badge;
    }

    // Update piece palette
    const themeColors = THEMES[themeId].colors;
    for (const key of Object.keys(TETROMINOES)) {
      if (themeColors[key]) {
        TETROMINOES[key].color = themeColors[key];
      }
    }
  }

  static getRenderStyle() {
    return THEMES[this.currentTheme]?.renderStyle || 'glossy';
  }
}

/* ============================================================================
   3. PUZZLE STAGES DEFINITION (10 HANDCRAFTED CHALLENGES)
   ============================================================================ */
const PUZZLE_STAGES = [
  {
    id: 1,
    name: "Teka-Teki Pembuka",
    targetLines: 1,
    pieceQueue: ['I', 'O', 'T', 'J'],
    setup: (board) => {
      // Row 19 filled except column 4
      for (let c = 0; c < COLS; c++) {
        if (c !== 4) board[19][c] = '#ffbe0b';
      }
    }
  },
  {
    id: 2,
    name: "Double Strike",
    targetLines: 2,
    pieceQueue: ['O', 'I', 'J', 'L'],
    setup: (board) => {
      for (let c = 0; c < COLS; c++) {
        if (c < 4 || c > 5) {
          board[18][c] = '#06d6a0';
          board[19][c] = '#06d6a0';
        }
      }
    }
  },
  {
    id: 3,
    name: "Slot T-Spin",
    targetLines: 2,
    pieceQueue: ['T', 'I', 'L', 'O'],
    setup: (board) => {
      for (let c = 0; c < COLS; c++) {
        if (c < 3 || c > 5) {
          board[19][c] = '#a370f7';
          board[18][c] = '#a370f7';
        }
      }
      board[17][3] = '#a370f7';
      board[17][5] = '#a370f7';
    }
  },
  {
    id: 4,
    name: "Rongga Huruf L",
    targetLines: 2,
    pieceQueue: ['J', 'L', 'O', 'I'],
    setup: (board) => {
      for (let c = 0; c < COLS; c++) {
        if (c !== 8 && c !== 9) {
          board[19][c] = '#ff7b00';
          board[18][c] = '#ff7b00';
        }
      }
      board[17][8] = '#ff7b00';
    }
  },
  {
    id: 5,
    name: "Candy Bomb Cleanse",
    targetLines: 2,
    pieceQueue: ['BOMB', 'O', 'I', 'T'],
    setup: (board) => {
      for (let c = 0; c < COLS; c++) {
        if (c < 4 || c > 5) {
          board[18][c] = '#ff4d6d';
          board[19][c] = '#ff4d6d';
        }
      }
      // Junk blocking the entrance
      board[16][4] = '#ff4d6d';
      board[16][5] = '#ff4d6d';
      board[17][4] = '#ff4d6d';
      board[17][5] = '#ff4d6d';
    }
  },
  {
    id: 6,
    name: "Tangga Piramida",
    targetLines: 3,
    pieceQueue: ['O', 'I', 'J', 'L', 'T'],
    setup: (board) => {
      for (let r = 17; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
          board[r][c] = '#4361ee';
        }
      }
    }
  },
  {
    id: 7,
    name: "Sumur Dalam 4-Line",
    targetLines: 4,
    pieceQueue: ['I', 'O', 'T', 'S', 'J'],
    setup: (board) => {
      for (let r = 16; r < ROWS; r++) {
        for (let c = 0; c < 9; c++) {
          board[r][c] = '#00e5ff';
        }
      }
    }
  },
  {
    id: 8,
    name: "Double Blast Tactical",
    targetLines: 2,
    pieceQueue: ['BOMB', 'BOMB', 'O', 'I', 'T', 'L'],
    setup: (board) => {
      for (let c = 0; c < COLS; c++) {
        if (c !== 2 && c !== 3 && c !== 6 && c !== 7) {
          board[18][c] = '#ff2a2a';
          board[19][c] = '#ff2a2a';
        }
      }
      // Two junk barriers above the holes
      board[16][2] = '#ff2a2a';
      board[16][3] = '#ff2a2a';
      board[17][2] = '#ff2a2a';
      board[17][3] = '#ff2a2a';
      board[16][6] = '#ff2a2a';
      board[16][7] = '#ff2a2a';
      board[17][6] = '#ff2a2a';
      board[17][7] = '#ff2a2a';
    }
  },
  {
    id: 9,
    name: "Kombo Beruntun",
    targetLines: 3,
    pieceQueue: ['T', 'I', 'I', 'O', 'L', 'J'],
    setup: (board) => {
      for (let r = 17; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (c !== (r - 14)) board[r][c] = '#ffbe0b';
        }
      }
    }
  },
  {
    id: 10,
    name: "Grand Master Finale",
    targetLines: 4,
    pieceQueue: ['BOMB', 'O', 'O', 'I', 'T', 'J', 'L'],
    setup: (board) => {
      for (let r = 16; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (c !== 4 && c !== 5) board[r][c] = '#a370f7';
        }
      }
      board[14][4] = '#a370f7';
      board[14][5] = '#a370f7';
      board[15][4] = '#a370f7';
      board[15][5] = '#a370f7';
    }
  }
];

/* ============================================================================
   4. DETERMINISTIC PRNG FOR DAILY CHALLENGE
   ============================================================================ */
function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getDateSeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createMulberry32(seed) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================================
   5. PUNCHY ARCADE AUDIO SYNTHESIZER
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playMove() {
    this.playChime(420, 0.06, 'triangle', 0.05);
  }

  playRotate() {
    this.playChime(580, 0.08, 'sine', 0.08);
  }

  playDrop() {
    this.playChime(220, 0.1, 'triangle', 0.1);
  }

  playLineClear(isMega = false) {
    if (this.muted || !this.ctx) return;
    const notes = isMega ? [440, 554, 659, 880] : [523, 659, 784];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.18, 'sine', 0.14);
      }, idx * 60);
    });
  }

  playExplosion() {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + 0.6);

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.5);

      subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  }

  playFuseTick(urgent = false) {
    if (this.muted || !this.ctx) return;
    const freq = urgent ? 880 : 540;
    this.playChime(freq, 0.05, 'square', urgent ? 0.09 : 0.04);
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    const notes = [392, 349, 311, 261];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.25, 'sawtooth', 0.12);
      }, idx * 100);
    });
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.2, 'sine', 0.16);
      }, idx * 80);
    });
  }
}

const sfx = new PlayfulAudio();

/* ============================================================================
   6. PARTICLE SYSTEM & SHOCKWAVE VFX
   ============================================================================ */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.shockwaves = [];
  }

  resize(width, height) {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  updateAndDraw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= sw.decay;

      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 190, 11, ${sw.alpha})`;
      this.ctx.lineWidth = sw.lineWidth;
      this.ctx.stroke();
      this.ctx.restore();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.15;
      p.rotation = (p.rotation || 0) + (p.rotSpeed || 0.05);
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.isDebris) {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  spawnBombExplosion(x, y) {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      speed: 12,
      alpha: 1.0,
      decay: 0.045,
      lineWidth: 8
    });

    const colors = ['#ff2a2a', '#ffbe0b', '#ff7b00', '#ffffff'];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.18,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.025,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        isDebris: Math.random() > 0.4
      });
    }
  }

  spawnLineClearDebris(rowY, colorsInRow, blockSize) {
    for (let c = 0; c < COLS; c++) {
      const color = colorsInRow[c];
      if (!color || color === 0) continue;

      const blockCenterX = c * blockSize + blockSize / 2;
      const blockCenterY = rowY * blockSize + blockSize / 2;

      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: blockCenterX + (Math.random() - 0.5) * blockSize * 0.6,
          y: blockCenterY + (Math.random() - 0.5) * blockSize * 0.6,
          vx: (Math.random() - 0.5) * 6,
          vy: -2 - Math.random() * 4,
          gravity: 0.22,
          size: blockSize * (0.2 + Math.random() * 0.2),
          color: color,
          alpha: 1.0,
          decay: 0.025 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          isDebris: true
        });
      }
    }
  }

  spawnMegaRBlockBurst(width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const rainbow = ['#ff4d6d', '#ffbe0b', '#00e5ff', '#06d6a0', '#a370f7'];

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 10;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        gravity: 0.15,
        size: 4 + Math.random() * 6,
        color: rainbow[i % rainbow.length],
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.015,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        isDebris: false
      });
    }
  }
}

/* ============================================================================
   7. GAME STATE & MECHANICS
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

    this.mode = GameMode.CLASSIC;
    this.dailyTargetLines = 15;
    this.dailyPrng = null;
    this.puzzleStage = 1;
    this.puzzleQueue = [];
    this.puzzleTargetLines = 1;

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
    if (this.mode === GameMode.CLASSIC && this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('rblock_adventure_highscore', this.highScore.toString());
      } catch (e) {}
    }
  }

  reset(mode = GameMode.CLASSIC, stageIndex = 1) {
    this.mode = mode;
    this.board = this.createEmptyBoard();
    this.bag = [];
    this.piecesSinceLastBomb = 0;
    this.comboStreak = 0;
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.status = GameStatus.PLAYING;
    this.holdPiece = null;
    this.canHold = true;

    if (this.mode === GameMode.DAILY) {
      const dateStr = getTodayDateString();
      const seed = getDateSeed(dateStr);
      this.dailyPrng = createMulberry32(seed);

      // Generate 4 obstacle rows at bottom deterministically
      for (let r = 16; r < ROWS; r++) {
        const holeCol1 = Math.floor(this.dailyPrng() * COLS);
        const holeCol2 = Math.floor(this.dailyPrng() * COLS);
        const holeCol3 = Math.floor(this.dailyPrng() * COLS);

        for (let c = 0; c < COLS; c++) {
          if (c !== holeCol1 && c !== holeCol2 && c !== holeCol3) {
            const colors = ['#00e5ff', '#ffbe0b', '#06d6a0', '#ff4d6d', '#a370f7'];
            const colorIdx = Math.floor(this.dailyPrng() * colors.length);
            this.board[r][c] = colors[colorIdx];
          }
        }
      }

      this.currentPiece = this.getNewPiece();
      this.nextPiece = this.getNewPiece();
    } else if (this.mode === GameMode.PUZZLE) {
      this.puzzleStage = stageIndex;
      const stageDef = PUZZLE_STAGES[stageIndex - 1] || PUZZLE_STAGES[0];
      stageDef.setup(this.board);
      this.puzzleTargetLines = stageDef.targetLines;
      this.puzzleQueue = [...stageDef.pieceQueue];

      this.currentPiece = this.getNewPiece();
      this.nextPiece = this.getNewPiece();
    } else {
      // Classic Mode
      this.currentPiece = this.getNewPiece();
      this.nextPiece = this.getNewPiece();
    }

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
    if (this.mode === GameMode.PUZZLE) {
      if (this.puzzleQueue.length > 0) {
        return this.puzzleQueue.shift();
      }
      return null;
    }

    if (this.mode === GameMode.DAILY) {
      if (this.bag.length === 0) {
        this.bag = [...CLASSIC_PIECE_KEYS];
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(this.dailyPrng() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      return this.bag.pop();
    }

    // Classic Bag Randomizer + Candy Bomb
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
    if (!type) return null;
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

  moveLeft() {
    if (this.status !== GameStatus.PLAYING || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      sfx.playMove();
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.status !== GameStatus.PLAYING || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      sfx.playMove();
      return true;
    }
    return false;
  }

  softDrop() {
    if (this.status !== GameStatus.PLAYING || !this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.score += 1;
      return true;
    } else {
      this.lockCurrentPiece();
      return false;
    }
  }

  hardDrop() {
    if (this.status !== GameStatus.PLAYING || !this.currentPiece) return;
    let dropDistance = 0;
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      dropDistance++;
    }
    this.score += dropDistance * 2;
    this.lockCurrentPiece();
    game.triggerScreenShake(false);
  }

  rotate() {
    if (this.status !== GameStatus.PLAYING || !this.currentPiece) return;
    if (this.currentPiece.type === 'O' || this.currentPiece.isBomb) return;

    const original = this.currentPiece.matrix;
    const rotated = original[0].map((_, i) => original.map(row => row[i]).reverse());

    // Wall-kick offsets: 0, -1, +1, -2, +2
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.checkCollision(this.currentPiece, kick, 0, rotated)) {
        this.currentPiece.matrix = rotated;
        this.currentPiece.x += kick;
        sfx.playRotate();
        return;
      }
    }
  }

  hold() {
    if (this.status !== GameStatus.PLAYING || !this.canHold || !this.currentPiece) return;

    sfx.playChime(620, 0.08, 'sine', 0.1);
    const currentType = this.currentPiece.type;

    if (!this.holdPiece) {
      if (!this.nextPiece) return;
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

    // Check Win Conditions
    if (this.mode === GameMode.DAILY && this.linesCleared >= this.dailyTargetLines) {
      this.victory("Tantangan Harian Selesai! 🎉", "DAILY CHAMPION!");
      return;
    }

    if (this.mode === GameMode.PUZZLE && this.linesCleared >= this.puzzleTargetLines) {
      // Unlock next stage
      const currentUnlocked = parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
      if (this.puzzleStage >= currentUnlocked && this.puzzleStage < PUZZLE_STAGES.length) {
        localStorage.setItem('rblock_puzzle_unlocked', (this.puzzleStage + 1).toString());
      }
      this.victory(`Stage ${this.puzzleStage} Berhasil! 🌟`, "STAGE CLEARED!");
      return;
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNewPiece();
    this.canHold = true;
    this.initBombFuseIfActive();

    // Check if player ran out of pieces in Puzzle Mode
    if (this.mode === GameMode.PUZZLE && !this.currentPiece) {
      if (this.holdPiece) {
        const tempType = this.holdPiece;
        this.holdPiece = null;
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
        this.canHold = false;
        this.initBombFuseIfActive();
      } else {
        this.gameOver("Antrian Balok Habis! 🧩", "STAGE FAILED");
        return;
      }
    }

    if (this.currentPiece && this.checkCollision(this.currentPiece, 0, 0)) {
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

    const cleared = this.clearLines();
    if (cleared > 0) {
      sfx.playLineClear(cleared === 4);
      this.updateLevelAndScore(cleared);
      ui.triggerBanner(cleared, this.comboStreak);
      if (cleared === 4) {
        particles.spawnMegaRBlockBurst(game.renderer.width, game.renderer.height);
        game.triggerScreenShake(true);
      }
    }

    // Check Win Conditions
    if (this.mode === GameMode.DAILY && this.linesCleared >= this.dailyTargetLines) {
      this.victory("Tantangan Harian Selesai! 🎉", "DAILY CHAMPION!");
      return;
    }

    if (this.mode === GameMode.PUZZLE && this.linesCleared >= this.puzzleTargetLines) {
      const currentUnlocked = parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
      if (this.puzzleStage >= currentUnlocked && this.puzzleStage < PUZZLE_STAGES.length) {
        localStorage.setItem('rblock_puzzle_unlocked', (this.puzzleStage + 1).toString());
      }
      this.victory(`Stage ${this.puzzleStage} Berhasil! 🌟`, "STAGE CLEARED!");
      return;
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNewPiece();
    this.canHold = true;
    this.initBombFuseIfActive();

    // Check if player ran out of pieces in Puzzle Mode
    if (this.mode === GameMode.PUZZLE && !this.currentPiece) {
      if (this.holdPiece) {
        const tempType = this.holdPiece;
        this.holdPiece = null;
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
        this.canHold = false;
        this.initBombFuseIfActive();
      } else {
        this.gameOver("Antrian Balok Habis! 🧩", "STAGE FAILED");
        return;
      }
    }

    if (this.currentPiece && this.checkCollision(this.currentPiece, 0, 0)) {
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
    let lines = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        lines++;
        particles.spawnLineClearDebris(r, this.board[r], game.renderer.blockSize);
        this.board.splice(r, 1);
        this.board.unshift(Array(COLS).fill(0));
        r++; // Recheck same row index after shift
      }
    }
    return lines;
  }

  victory(title = "Mission Complete! 🌟", badge = "VICTORY!") {
    this.status = GameStatus.GAME_OVER;
    sfx.playVictory();
    particles.spawnMegaRBlockBurst(game.renderer.width, game.renderer.height);

    if (this.mode === GameMode.DAILY) {
      // Record daily streak
      const today = getTodayDateString();
      const lastDate = localStorage.getItem('rblock_daily_last_date');
      let streak = parseInt(localStorage.getItem('rblock_daily_streak') || '0', 10);

      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
          streak++;
        } else {
          streak = 1;
        }
        localStorage.setItem('rblock_daily_last_date', today);
        localStorage.setItem('rblock_daily_streak', streak.toString());
      }
    }

    ui.showGameOver(true, title, badge);
  }

  gameOver(customTitle = null, customBadge = null) {
    this.status = GameStatus.GAME_OVER;
    sfx.playGameOver();
    ui.showGameOver(false, customTitle, customBadge);
  }
}

/* ============================================================================
   8. RESPONSIVE CANVAS RENDERER & THEME BLOCK STYLES
   ============================================================================ */
class ResponsiveCanvasRenderer {
  constructor(container, canvas, nextCanvas, holdCanvas, holdCanvasMobile) {
    this.container = container;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');

    this.holdCanvas = holdCanvas;
    this.holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;

    this.holdCanvasMobile = holdCanvasMobile;
    this.holdCtxMobile = holdCanvasMobile ? holdCanvasMobile.getContext('2d') : null;

    this.blockSize = 30;
    this.width = 300;
    this.height = 600;

    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    let availableW = rect.width;
    let availableH = rect.height;

    let targetBlockSize = Math.floor(Math.min(availableW / COLS, availableH / ROWS));
    targetBlockSize = Math.max(16, targetBlockSize);

    this.blockSize = targetBlockSize;
    this.width = this.blockSize * COLS;
    this.height = this.blockSize * ROWS;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    if (particles) {
      particles.resize(this.width, this.height);
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
    const style = ThemeManager.getRenderStyle();
    this.ctx.strokeStyle = style === 'neon' ? 'rgba(0, 229, 255, 0.08)' : (style === 'retro' ? 'rgba(139, 172, 15, 0.1)' : 'rgba(255, 255, 255, 0.04)');
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
          this.drawThemedBlock(this.ctx, c * this.blockSize, r * this.blockSize, this.blockSize, color);
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
            this.drawThemedBlock(context, (x + c) * size, (y + r) * size, size, color);
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

  drawThemedBlock(ctx, x, y, size, color) {
    const style = ThemeManager.getRenderStyle();
    ctx.save();

    const pad = Math.max(1, size * 0.05);
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;

    if (style === 'neon') {
      // Cyber Neon: Glowing stroke, semi-transparent center
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(4, bs * 0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, bs * 0.12);

      this.drawRoundedRect(ctx, bx, by, bs, bs, Math.max(2, bs * 0.15));
      ctx.fillStyle = 'rgba(10, 8, 26, 0.7)';
      ctx.fill();
      ctx.stroke();

      // Inner small dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + bs / 2, by + bs / 2, Math.max(1, bs * 0.12), 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'pastel') {
      // Kawaii Pastel: Soft matte with cute rounded pill highlight
      const radius = Math.max(4, bs * 0.3);
      this.drawRoundedRect(ctx, bx, by, bs, bs, radius);
      ctx.fillStyle = color;
      ctx.fill();

      // Soft white outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mini cute shine spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(bx + bs * 0.75, by + bs * 0.25, Math.max(1.5, bs * 0.1), 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'retro') {
      // Retro 8-Bit GameBoy: Sharp pixel border with bevel
      ctx.fillStyle = '#0f380f';
      ctx.fillRect(bx, by, bs, bs);

      // Light Bevel (Top & Left)
      ctx.fillStyle = '#9bbc0f';
      ctx.fillRect(bx + 1, by + 1, bs - 2, 2);
      ctx.fillRect(bx + 1, by + 1, 2, bs - 2);

      // Dark Bevel (Bottom & Right)
      ctx.fillStyle = '#306230';
      ctx.fillRect(bx + 1, by + bs - 3, bs - 2, 2);
      ctx.fillRect(bx + bs - 3, by + 1, 2, bs - 2);

      // Center
      ctx.fillStyle = color;
      ctx.fillRect(bx + 3, by + 3, bs - 6, bs - 6);
    } else {
      // Default: Candy Jelly (Glossy rounded permen)
      const radius = Math.max(3, bs * 0.22);
      this.drawRoundedRect(ctx, bx, by, bs, bs, radius);
      ctx.fillStyle = color;
      ctx.fill();

      // Bottom shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      this.drawRoundedRect(ctx, bx + 1, by + bs - Math.max(2, bs * 0.16), bs - 2, Math.max(2, bs * 0.14), 2);
      ctx.fill();

      // Top gloss shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      this.drawRoundedRect(ctx, bx + 2, by + 2, bs - 4, (bs - 4) * 0.4, Math.max(2, radius * 0.6));
      ctx.fill();

      // Sparkle dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(bx + bs - Math.max(3, bs * 0.2), by + Math.max(3, bs * 0.2), Math.max(1, bs * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }

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

      ctx.fillStyle = isUrgent ? '#ffff00' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, badgeX, badgeY - 4);
    }
    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  renderPreview(piece, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    if (!piece) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = `${Math.floor(w * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👀', w / 2, h / 2);
      ctx.restore();
      return;
    }

    const matrix = piece.matrix;
    const cols = matrix[0].length;
    const rows = matrix.length;
    const cellSize = Math.min(Math.floor((w * 0.75) / cols), Math.floor((h * 0.75) / rows), 22);

    const offsetX = Math.floor((w - cols * cellSize) / 2);
    const offsetY = Math.floor((h - rows * cellSize) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] !== 0) {
          if (piece.isBomb) {
            this.draw1x1BombBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize);
          } else {
            this.drawThemedBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, piece.color);
          }
        }
      }
    }
  }

  renderHold(pieceType, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    if (!pieceType) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = `${Math.floor(w * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎒', w / 2, h / 2);
      ctx.restore();
      return;
    }

    const def = TETROMINOES[pieceType];
    const matrix = def.shape;
    const cols = matrix[0].length;
    const rows = matrix.length;
    const cellSize = Math.min(Math.floor((w * 0.75) / cols), Math.floor((h * 0.75) / rows), 22);

    const offsetX = Math.floor((w - cols * cellSize) / 2);
    const offsetY = Math.floor((h - rows * cellSize) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] !== 0) {
          if (def.isBomb) {
            this.draw1x1BombBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize);
          } else {
            this.drawThemedBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, def.color);
          }
        }
      }
    }
  }
}

/* ============================================================================
   9. UI CONTROLLER & MODALS
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
    this.themeOverlay = document.getElementById('theme-overlay');

    this.objectiveCard = document.getElementById('mode-objective-card');
    this.objectiveTitle = document.getElementById('objective-title');
    this.objectiveValue = document.getElementById('objective-value');
    this.objectiveSub = document.getElementById('objective-sub');

    this.finalScoreElem = document.getElementById('final-score');
    this.finalLevelElem = document.getElementById('final-level');
    this.finalLinesElem = document.getElementById('final-lines');
    this.finalMiddleLabel = document.getElementById('final-middle-label');

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

    // Update Mode Objective Card
    if (state.mode === GameMode.DAILY) {
      if (this.objectiveCard) this.objectiveCard.classList.remove('hidden');
      if (this.objectiveTitle) this.objectiveTitle.textContent = 'DAILY TARGET';
      if (this.objectiveValue) this.objectiveValue.textContent = `${state.linesCleared} / ${state.dailyTargetLines}`;
      if (this.objectiveSub) this.objectiveSub.textContent = 'Bersihkan 15 Baris!';
    } else if (state.mode === GameMode.PUZZLE) {
      if (this.objectiveCard) this.objectiveCard.classList.remove('hidden');
      if (this.objectiveTitle) this.objectiveTitle.textContent = `STAGE ${state.puzzleStage}`;
      if (this.objectiveValue) this.objectiveValue.textContent = `${state.linesCleared} / ${state.puzzleTargetLines}`;
      const remainingCount = state.puzzleQueue.length + (state.currentPiece ? 1 : 0) + (state.nextPiece ? 1 : 0) + (state.holdPiece ? 1 : 0);
      if (this.objectiveSub) this.objectiveSub.textContent = `Sisa Antrian: ${remainingCount}`;
    } else {
      if (this.objectiveCard) this.objectiveCard.classList.add('hidden');
    }
  }

  showStart() {
    this.startOverlay.classList.remove('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    if (this.leaderboardOverlay) this.leaderboardOverlay.classList.add('hidden');
    if (this.themeOverlay) this.themeOverlay.classList.add('hidden');

    this.renderStartModeUI();
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

  showTheme() {
    if (this.themeOverlay) this.themeOverlay.classList.remove('hidden');
  }

  hideTheme() {
    if (this.themeOverlay) this.themeOverlay.classList.add('hidden');
  }

  showLeaderboard() {
    if (this.leaderboardOverlay) this.leaderboardOverlay.classList.remove('hidden');
  }

  hideLeaderboard() {
    if (this.leaderboardOverlay) this.leaderboardOverlay.classList.add('hidden');
  }

  renderStartModeUI() {
    const activeMode = game ? game.selectedMode : GameMode.CLASSIC;
    const descText = document.getElementById('mode-desc-text');
    const stagePicker = document.getElementById('puzzle-stage-picker');
    const dailyStreakBadge = document.getElementById('daily-streak-badge');
    const streakCount = document.getElementById('daily-streak-count');

    document.querySelectorAll('.mode-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-mode') === activeMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (activeMode === GameMode.DAILY) {
      if (descText) {
        const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        descText.innerHTML = `<strong>Tantangan ${today}</strong>: Matrix awal berisi rintangan identik untuk semua pemain. Bersihkan <strong>15 baris</strong> secepat mungkin!`;
      }
      if (stagePicker) stagePicker.classList.add('hidden');
      if (dailyStreakBadge) {
        dailyStreakBadge.classList.remove('hidden');
        const streak = localStorage.getItem('rblock_daily_streak') || '0';
        if (streakCount) streakCount.textContent = streak;
      }
    } else if (activeMode === GameMode.PUZZLE) {
      if (descText) {
        descText.innerHTML = `Pecahkan <strong>10 teka-teki taktis</strong> bertahap dengan susunan rintangan dan antrian balok terbatas!`;
      }
      if (stagePicker) stagePicker.classList.remove('hidden');
      if (dailyStreakBadge) dailyStreakBadge.classList.add('hidden');

      this.renderPuzzleStagesButtons();
    } else {
      if (descText) {
        descText.innerHTML = `Mode arcade murni tak terbatas! Susun balok permen, pecahkan rekor tertinggi, dan gunakan <strong>Candy Bomb 💣</strong>.`;
      }
      if (stagePicker) stagePicker.classList.add('hidden');
      if (dailyStreakBadge) dailyStreakBadge.classList.add('hidden');
    }
  }

  renderPuzzleStagesButtons() {
    const container = document.getElementById('stage-buttons-container');
    if (!container) return;
    container.innerHTML = '';

    const unlocked = parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
    const selected = game ? game.selectedPuzzleStage : 1;

    for (let i = 1; i <= PUZZLE_STAGES.length; i++) {
      const btn = document.createElement('button');
      btn.className = `stage-num-btn ${i === selected ? 'active' : ''} ${i > unlocked ? 'locked' : ''}`;
      btn.textContent = i > unlocked ? '🔒' : i;
      btn.title = `Stage ${i}: ${PUZZLE_STAGES[i - 1].name}`;

      if (i <= unlocked) {
        btn.addEventListener('click', () => {
          game.selectedPuzzleStage = i;
          this.renderPuzzleStagesButtons();
        });
      }
      container.appendChild(btn);
    }
  }

  showGameOver(isVictory = false, customTitle = null, customBadge = null) {
    this.finalScoreElem.textContent = game.state.score.toLocaleString();
    this.finalLinesElem.textContent = game.state.linesCleared;

    const mascot = document.getElementById('gameover-mascot');
    const badge = document.getElementById('gameover-badge');
    const title = document.getElementById('gameover-title');

    if (isVictory) {
      if (mascot) mascot.textContent = '🏆';
      if (badge) badge.textContent = customBadge || 'VICTORY!';
      if (title) title.textContent = customTitle || 'Kamu Berhasil!';
    } else {
      if (mascot) mascot.textContent = (game.state.mode === GameMode.PUZZLE) ? '🧩' : '🌟';
      if (badge) badge.textContent = customBadge || (game.state.mode === GameMode.PUZZLE ? 'STAGE FAILED' : 'AWESOME TRY!');
      if (title) title.textContent = customTitle || (game.state.mode === GameMode.PUZZLE ? 'Balok Habis! Coba Lagi 🧩' : 'Permainan Berakhir');
    }

    const nextStageBtn = document.getElementById('next-stage-btn');
    const chooseStageBtn = document.getElementById('choose-stage-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const lbSection = document.getElementById('leaderboard-save-section');
    const viewLbBtn = document.getElementById('view-leaderboard-from-gameover-btn');

    if (game.state.mode === GameMode.PUZZLE) {
      if (this.finalMiddleLabel) this.finalMiddleLabel.textContent = 'STAGE';
      if (this.finalLevelElem) this.finalLevelElem.textContent = game.state.puzzleStage;

      // Hide leaderboard save input on puzzle stages to keep modal clean and focused
      if (lbSection) lbSection.classList.add('hidden');
      if (viewLbBtn) viewLbBtn.classList.add('hidden');

      if (isVictory) {
        const hasNext = game.state.puzzleStage < PUZZLE_STAGES.length;
        if (nextStageBtn) {
          nextStageBtn.classList.remove('hidden');
          nextStageBtn.textContent = hasNext ? `STAGE ${game.state.puzzleStage + 1} ⏩` : `SEMUA STAGE SELESAI! 👑`;
          nextStageBtn.disabled = !hasNext;
        }
        if (chooseStageBtn) chooseStageBtn.classList.remove('hidden');
        if (playAgainBtn) playAgainBtn.textContent = 'ULANGI STAGE 🔄';
      } else {
        if (nextStageBtn) nextStageBtn.classList.add('hidden');
        if (chooseStageBtn) chooseStageBtn.classList.remove('hidden');
        if (playAgainBtn) playAgainBtn.textContent = 'COBA LAGI 🔄';
      }
    } else {
      if (this.finalMiddleLabel) this.finalMiddleLabel.textContent = 'LEVEL';
      if (this.finalLevelElem) this.finalLevelElem.textContent = game.state.level;

      if (lbSection) lbSection.classList.remove('hidden');
      if (viewLbBtn) viewLbBtn.classList.remove('hidden');
      if (nextStageBtn) nextStageBtn.classList.add('hidden');
      if (chooseStageBtn) chooseStageBtn.classList.add('hidden');
      if (playAgainBtn) playAgainBtn.textContent = 'PLAY AGAIN! 🎈';
    }

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
    this.floatingBanner.textContent = `BOOM! 💣 +${bonus} (${destroyedCount} Balok!)`;
    this.floatingBanner.classList.remove('hidden');

    void this.floatingBanner.offsetWidth;

    this.bannerTimeout = setTimeout(() => {
      this.floatingBanner.classList.add('hidden');
    }, 1400);
  }
}

/* ============================================================================
   10. MULTI-MODE CLOUDFLARE PAGES FUNCTIONS & KV GLOBAL LEADERBOARD SERVICE
   ============================================================================ */
const DEFAULT_CLASSIC_LEADERBOARD = [
  { name: "RB_Master", score: 12500, date: "2026-09-01T12:00:00.000Z" },
  { name: "CandyQueen", score: 9800, date: "2026-09-02T14:30:00.000Z" },
  { name: "JellyStar", score: 7450, date: "2026-09-03T09:15:00.000Z" },
  { name: "SparkyBlock", score: 5200, date: "2026-09-04T08:00:00.000Z" },
  { name: "ChocoBlast", score: 3800, date: "2026-09-04T11:45:00.000Z" },
  { name: "LittleGamer", score: 2500, date: "2026-09-04T15:20:00.000Z" },
  { name: "PixelKid", score: 1600, date: "2026-09-04T16:10:00.000Z" }
];

const DEFAULT_DAILY_LEADERBOARD = [
  { name: "DailyHero", score: 4800, date: new Date().toISOString() },
  { name: "SpeedyBlock", score: 3950, date: new Date().toISOString() },
  { name: "PuzzleAce", score: 2900, date: new Date().toISOString() }
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
  static isOnline = false;

  static getLocalScores(mode = 'classic') {
    const key = mode === 'daily' ? `rblock_lb_daily_${getTodayDateString()}` : 'rblock_leaderboard_local';
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mode === 'daily' ? [...DEFAULT_DAILY_LEADERBOARD] : [...DEFAULT_CLASSIC_LEADERBOARD];
  }

  static saveLocalScore(name, score, mode = 'classic') {
    const key = mode === 'daily' ? `rblock_lb_daily_${getTodayDateString()}` : 'rblock_leaderboard_local';
    const list = this.getLocalScores(mode);
    list.push({ name, score, date: new Date().toISOString() });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 50);
    try {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {}
    return trimmed;
  }

  static async fetchScores(mode = 'classic') {
    try {
      const response = await fetch(`/api/leaderboard?mode=${mode}&date=${getTodayDateString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          this.isOnline = data.source === 'cloudflare_kv';
          return {
            scores: data.leaderboard,
            source: data.source || 'cloudflare_kv'
          };
        }
      }
    } catch (err) {
      this.isOnline = false;
    }
    return {
      scores: this.getLocalScores(mode).slice(0, 10),
      source: 'local_storage'
    };
  }

  static async submitScore(playerName, score, mode = 'classic') {
    const sanitizedName = (playerName || 'Player').trim().slice(0, 12);
    try {
      localStorage.setItem('rblock_player_name', sanitizedName);
    } catch (e) {}

    this.saveLocalScore(sanitizedName, score, mode);

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sanitizedName, score: score, mode: mode })
      });

      if (response.ok) {
        const data = await response.json();
        this.isOnline = true;
        return {
          success: true,
          rank: data.rank,
          message: data.message || `Luar biasa! Skor tersimpan di Cloudflare KV! 🌟`
        };
      }
    } catch (err) {
      this.isOnline = false;
    }

    return {
      success: true,
      message: `Yay! Skor ${score} dicatat untuk ${sanitizedName}! ⭐ (Tersimpan di rekor lokal)`
    };
  }
}

/* ============================================================================
   11. MAIN GAME CONTROLLER & USER INPUT (TOUCH & KEYBOARD)
   ============================================================================ */
class RBlockGame {
  constructor() {
    this.state = new GameState();
    this.selectedMode = GameMode.CLASSIC;
    this.selectedPuzzleStage = 1;
    this.currentLbMode = 'classic';

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
    this.animationId = null;

    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    this.init();
  }

  init() {
    ThemeManager.init();
    if (!this.state.nextPiece) {
      this.state.nextPiece = this.state.getNewPiece();
    }
    this.bindEvents();
    this.renderer.resize();
    this.ui.update(this.state);
    this.ui.showStart();

    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  start(mode = null, stage = 1) {
    sfx.init();
    const chosenMode = mode || this.selectedMode;
    this.state.reset(chosenMode, stage);
    this.ui.hideStart();
    this.ui.hideGameOver();
    this.ui.hidePause();
    this.ui.hideLeaderboard();
    this.ui.hideTheme();
    this.ui.update(this.state);
    this.dropCounter = 0;
  }

  pause() {
    if (this.state.status === GameStatus.PLAYING) {
      this.state.status = GameStatus.PAUSED;
      this.ui.showPause();
    }
  }

  resume() {
    if (this.state.status === GameStatus.PAUSED) {
      this.state.status = GameStatus.PLAYING;
      this.ui.hidePause();
      this.lastTime = performance.now();
    }
  }

  triggerScreenShake(isHeavy = false) {
    this.shakeDuration = isHeavy ? 400 : 150;
    this.shakeIntensity = isHeavy ? 8 : 3.5;
  }

  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.canvas.style.transform = `translate(${ox}px, ${oy}px)`;
      if (this.shakeDuration <= 0) {
        this.canvas.style.transform = 'none';
      }
    }

    if (this.state.status === GameStatus.PLAYING) {
      // Candy Bomb Fuse Timer logic
      if (this.state.currentPiece && this.state.currentPiece.isBomb) {
        this.state.bombFuseRemaining -= deltaTime;

        const currentSec = Math.ceil(this.state.bombFuseRemaining / 1000);
        if (currentSec !== this.state.lastTickSecond && currentSec > 0) {
          this.state.lastTickSecond = currentSec;
          sfx.playFuseTick(currentSec <= 3);
        }

        if (this.state.bombFuseRemaining <= 0) {
          this.state.detonateBomb(this.state.currentPiece.x, this.state.currentPiece.y);
          this.dropCounter = 0;
        }
      }

      this.dropCounter += deltaTime;
      const dropInterval = this.state.getDropInterval();
      if (this.dropCounter >= dropInterval) {
        this.state.softDrop();
        this.dropCounter = 0;
      }
    }

    this.pollGamepad(deltaTime);

    this.renderer.render(this.state);
    if (particles) particles.updateAndDraw();
    this.ui.update(this.state);

    this.animationId = requestAnimationFrame(time => this.gameLoop(time));
  }

  pollGamepad(deltaTime) {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gp = gamepads[i];
        break;
      }
    }
    if (!gp) return;

    if (!this.gpPrev) {
      this.gpPrev = {
        left: false, right: false, up: false, down: false,
        btnA: false, btnB: false, btnX: false, btnY: false,
        lb: false, rb: false, start: false,
        leftRepeatTimer: 0, rightRepeatTimer: 0, downRepeatTimer: 0
      };
    }

    const left = (gp.buttons[14] && gp.buttons[14].pressed) || (gp.axes[0] < -0.45);
    const right = (gp.buttons[15] && gp.buttons[15].pressed) || (gp.axes[0] > 0.45);
    const down = (gp.buttons[13] && gp.buttons[13].pressed) || (gp.axes[1] > 0.45);
    const up = (gp.buttons[12] && gp.buttons[12].pressed) || (gp.axes[1] < -0.45);

    const btnA = gp.buttons[0] && gp.buttons[0].pressed; // A / Cross
    const btnB = gp.buttons[1] && gp.buttons[1].pressed; // B / Circle
    const btnX = gp.buttons[2] && gp.buttons[2].pressed; // X / Square
    const btnY = gp.buttons[3] && gp.buttons[3].pressed; // Y / Triangle
    const lb = gp.buttons[4] && gp.buttons[4].pressed;   // L1
    const rb = gp.buttons[5] && gp.buttons[5].pressed;   // R1
    const start = gp.buttons[9] && gp.buttons[9].pressed; // Start / Options

    if (this.state.status === GameStatus.PLAYING) {
      if (start && !this.gpPrev.start) {
        this.pause();
      }

      if ((up && !this.gpPrev.up) || (btnA && !this.gpPrev.btnA) || (rb && !this.gpPrev.rb)) {
        this.state.rotate();
      }

      if (btnY && !this.gpPrev.btnY) {
        this.state.hardDrop();
        this.dropCounter = 0;
      }

      if ((btnB && !this.gpPrev.btnB) || (btnX && !this.gpPrev.btnX) || (lb && !this.gpPrev.lb)) {
        this.state.hold();
      }

      if (left) {
        if (!this.gpPrev.left) {
          this.state.moveLeft();
          this.gpPrev.leftRepeatTimer = 170;
        } else {
          this.gpPrev.leftRepeatTimer -= deltaTime;
          if (this.gpPrev.leftRepeatTimer <= 0) {
            this.state.moveLeft();
            this.gpPrev.leftRepeatTimer = 65;
          }
        }
      }

      if (right) {
        if (!this.gpPrev.right) {
          this.state.moveRight();
          this.gpPrev.rightRepeatTimer = 170;
        } else {
          this.gpPrev.rightRepeatTimer -= deltaTime;
          if (this.gpPrev.rightRepeatTimer <= 0) {
            this.state.moveRight();
            this.gpPrev.rightRepeatTimer = 65;
          }
        }
      }

      if (down) {
        if (!this.gpPrev.down) {
          this.state.softDrop();
          this.dropCounter = 0;
          this.gpPrev.downRepeatTimer = 110;
        } else {
          this.gpPrev.downRepeatTimer -= deltaTime;
          if (this.gpPrev.downRepeatTimer <= 0) {
            this.state.softDrop();
            this.dropCounter = 0;
            this.gpPrev.downRepeatTimer = 50;
          }
        }
      }
    } else if (this.state.status === GameStatus.PAUSED) {
      if (start && !this.gpPrev.start) {
        this.resume();
      }
    }

    this.gpPrev.left = left;
    this.gpPrev.right = right;
    this.gpPrev.up = up;
    this.gpPrev.down = down;
    this.gpPrev.btnA = btnA;
    this.gpPrev.btnB = btnB;
    this.gpPrev.btnX = btnX;
    this.gpPrev.btnY = btnY;
    this.gpPrev.lb = lb;
    this.gpPrev.rb = rb;
    this.gpPrev.start = start;
  }

  bindEvents() {
    // Keyboard & Smart TV Shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.state.status === GameStatus.GAME_OVER) return;

      // Smart TV Remote Back keys (Samsung Tizen: 10009, LG webOS: 461)
      if (e.keyCode === 10009 || e.keyCode === 461) {
        if (this.state.status === GameStatus.PLAYING) this.pause();
        else if (this.state.status === GameStatus.PAUSED) this.resume();
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          if (this.state.status === GameStatus.PLAYING) this.state.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (this.state.status === GameStatus.PLAYING) this.state.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          if (this.state.status === GameStatus.PLAYING) this.state.rotate();
          break;
        case 'Enter':
        case 'NumpadEnter':
        case 'Select':
          if (this.state.status === GameStatus.PLAYING) this.state.rotate();
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (this.state.status === GameStatus.PLAYING) {
            this.state.softDrop();
            this.dropCounter = 0;
          }
          break;
        case 'Space':
          e.preventDefault();
          if (this.state.status === GameStatus.PLAYING) {
            this.state.hardDrop();
            this.dropCounter = 0;
          }
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          if (this.state.status === GameStatus.PLAYING) this.state.hold();
          break;
        case 'KeyP':
        case 'Escape':
        case 'BrowserBack':
        case 'GoBack':
        case 'MediaPlayPause':
        case 'MediaPause':
          if (this.state.status === GameStatus.PLAYING) this.pause();
          else if (this.state.status === GameStatus.PAUSED) this.resume();
          break;
        case 'KeyM':
          this.toggleAudio();
          break;
        case 'KeyL':
          this.openLeaderboard();
          break;
        case 'KeyT':
          this.openThemeModal();
          break;
      }
    });

    // Canvas Direct Touch Gestures (Drag, Soft Drop, Super Drop Flick, Tap to Rotate)
    let touchStartX = 0;
    let touchStartY = 0;
    let lastTrackedX = 0;
    let lastTrackedY = 0;
    let touchStartTime = 0;
    let isTouchActive = false;

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state.status !== GameStatus.PLAYING) return;
      sfx.init();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      lastTrackedX = touch.clientX;
      lastTrackedY = touch.clientY;
      touchStartTime = performance.now();
      isTouchActive = true;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!isTouchActive || this.state.status !== GameStatus.PLAYING) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTrackedX;
      const deltaY = touch.clientY - lastTrackedY;
      const threshold = this.renderer.blockSize * 0.85;

      if (Math.abs(deltaX) >= threshold) {
        if (deltaX > 0) this.state.moveRight();
        else this.state.moveLeft();
        lastTrackedX = touch.clientX;
      }

      if (deltaY >= threshold) {
        this.state.softDrop();
        this.dropCounter = 0;
        lastTrackedY = touch.clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!isTouchActive || this.state.status !== GameStatus.PLAYING) return;
      isTouchActive = false;

      const touch = e.changedTouches[0];
      const totalDeltaX = touch.clientX - touchStartX;
      const totalDeltaY = touch.clientY - touchStartY;
      const touchDuration = performance.now() - touchStartTime;

      if (Math.abs(totalDeltaX) < 14 && Math.abs(totalDeltaY) < 14 && touchDuration < 240) {
        this.state.rotate();
        return;
      }

      if (totalDeltaY > this.renderer.blockSize * 1.8 && touchDuration < 280) {
        this.state.hardDrop();
        this.dropCounter = 0;
      }
    }, { passive: true });

    // Header buttons
    document.getElementById('pause-btn')?.addEventListener('click', () => {
      if (this.state.status === GameStatus.PLAYING) this.pause();
      else if (this.state.status === GameStatus.PAUSED) this.resume();
    });

    document.getElementById('audio-toggle-btn')?.addEventListener('click', () => this.toggleAudio());
    document.getElementById('leaderboard-btn')?.addEventListener('click', () => this.openLeaderboard());
    document.getElementById('theme-btn')?.addEventListener('click', () => this.openThemeModal());

    // Start Screen Mode Switcher Tabs
    document.getElementById('tab-classic')?.addEventListener('click', () => {
      this.selectedMode = GameMode.CLASSIC;
      this.ui.renderStartModeUI();
    });
    document.getElementById('tab-daily')?.addEventListener('click', () => {
      this.selectedMode = GameMode.DAILY;
      this.ui.renderStartModeUI();
    });
    document.getElementById('tab-puzzle')?.addEventListener('click', () => {
      this.selectedMode = GameMode.PUZZLE;
      this.ui.renderStartModeUI();
    });

    // Start Game Button
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.start(this.selectedMode, this.selectedPuzzleStage);
    });

    // Pause Screen Buttons
    document.getElementById('resume-game-btn')?.addEventListener('click', () => this.resume());
    document.getElementById('restart-from-pause-btn')?.addEventListener('click', () => {
      this.start(this.selectedMode, this.selectedPuzzleStage);
    });
    document.getElementById('menu-from-pause-btn')?.addEventListener('click', () => {
      this.state.status = GameStatus.READY;
      this.ui.hidePause();
      this.ui.showStart();
    });

    // Game Over Buttons
    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      this.start(this.selectedMode, this.selectedPuzzleStage);
    });
    document.getElementById('menu-from-gameover-btn')?.addEventListener('click', () => {
      this.state.status = GameStatus.READY;
      this.ui.hideGameOver();
      this.ui.showStart();
    });
    document.getElementById('next-stage-btn')?.addEventListener('click', () => {
      const nextStage = this.state.puzzleStage + 1;
      if (nextStage <= PUZZLE_STAGES.length) {
        this.selectedPuzzleStage = nextStage;
        this.start(GameMode.PUZZLE, nextStage);
      }
    });
    document.getElementById('choose-stage-btn')?.addEventListener('click', () => {
      this.ui.hideGameOver();
      this.selectedMode = GameMode.PUZZLE;
      const unlocked = parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
      if (this.state.puzzleStage < unlocked) {
        this.selectedPuzzleStage = Math.min(this.state.puzzleStage + 1, PUZZLE_STAGES.length);
      }
      this.ui.showStart();
    });
    document.getElementById('view-leaderboard-from-gameover-btn')?.addEventListener('click', () => {
      this.openLeaderboard();
    });

    // Theme Modal Actions
    document.querySelectorAll('.theme-card').forEach((card) => {
      card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme');
        ThemeManager.applyTheme(theme, true);
      });
    });
    document.getElementById('close-theme-btn')?.addEventListener('click', () => {
      this.ui.hideTheme();
    });

    // Leaderboard Tabs & Actions
    document.getElementById('lb-tab-classic')?.addEventListener('click', () => {
      this.currentLbMode = 'classic';
      this.updateLbTabs();
      this.loadAndRenderLeaderboard();
    });
    document.getElementById('lb-tab-daily')?.addEventListener('click', () => {
      this.currentLbMode = 'daily';
      this.updateLbTabs();
      this.loadAndRenderLeaderboard();
    });
    document.getElementById('refresh-leaderboard-btn')?.addEventListener('click', () => {
      this.loadAndRenderLeaderboard();
    });
    document.getElementById('close-leaderboard-btn')?.addEventListener('click', () => {
      this.closeLeaderboard();
    });

    // Mobile D-Pad & Actions
    const bindTouch = (id, fn) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sfx.init();
        fn();
      }, { passive: false });
    };

    bindTouch('touch-left', () => this.state.moveLeft());
    bindTouch('touch-right', () => this.state.moveRight());
    bindTouch('touch-down', () => {
      this.state.softDrop();
      this.dropCounter = 0;
    });
    bindTouch('touch-rotate', () => this.state.rotate());
    bindTouch('touch-hard-drop', () => {
      this.state.hardDrop();
      this.dropCounter = 0;
    });
    bindTouch('touch-hold', () => this.state.hold());

    // Submit Highscore Button
    const submitBtn = document.getElementById('submit-score-btn');
    const nameInput = document.getElementById('player-name-input');
    const feedbackMsg = document.getElementById('leaderboard-feedback');

    submitBtn?.addEventListener('click', async () => {
      const name = nameInput.value.trim() || 'Hero Player';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan... ✨';

      feedbackMsg.className = 'status-msg';
      feedbackMsg.textContent = 'Menghubungkan ke Cloudflare KV...';
      feedbackMsg.classList.remove('hidden');

      const modeToSubmit = this.state.mode === GameMode.DAILY ? 'daily' : 'classic';
      const result = await LeaderboardService.submitScore(name, this.state.score, modeToSubmit);

      feedbackMsg.textContent = result.message;
      feedbackMsg.classList.add(result.success ? 'success' : 'error');
      submitBtn.textContent = 'Tersimpan! ⭐';
    });
  }

  updateLbTabs() {
    document.getElementById('lb-tab-classic')?.classList.toggle('active', this.currentLbMode === 'classic');
    document.getElementById('lb-tab-daily')?.classList.toggle('active', this.currentLbMode === 'daily');

    const datePill = document.getElementById('lb-date-pill');
    if (datePill) {
      datePill.textContent = this.currentLbMode === 'daily' ? `Hari Ini (${getTodayDateString()})` : 'Global All-Time';
    }
  }

  openThemeModal() {
    if (this.state.status === GameStatus.PLAYING) {
      this.pause();
    }
    this.ui.showTheme();
  }

  async openLeaderboard() {
    if (this.state.status === GameStatus.PLAYING) {
      this.pause();
    }
    this.ui.showLeaderboard();
    this.updateLbTabs();
    await this.loadAndRenderLeaderboard();
  }

  closeLeaderboard() {
    this.ui.hideLeaderboard();
  }

  async loadAndRenderLeaderboard() {
    const listElem = document.getElementById('leaderboard-list');
    const loadingElem = document.getElementById('leaderboard-loading');
    const statusPill = document.getElementById('lb-status-pill');

    if (loadingElem) loadingElem.classList.remove('hidden');
    if (listElem) listElem.innerHTML = '';

    const { scores, source } = await LeaderboardService.fetchScores(this.currentLbMode);

    if (statusPill) {
      if (source === 'cloudflare_kv') {
        statusPill.className = 'status-pill online';
        statusPill.textContent = '🟢 Cloudflare KV Online';
      } else {
        statusPill.className = 'status-pill offline';
        statusPill.textContent = '🟡 Rekor Lokal';
      }
    }

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

/* ============================================================================
   12. PWA SERVICE WORKER & APP BOOTSTRAP
   ============================================================================ */
let game;
let ui;
let particles;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('RBlock PWA Service Worker Registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('RBlock PWA Service Worker Failed:', err);
      });
  });
}

// Handle PWA Install Prompt
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.classList.add('hidden');
      }
      deferredPrompt = null;
    });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const particleCanvas = document.getElementById('particles-canvas');
  particles = new ParticleSystem(particleCanvas);
  game = new RBlockGame();
  ui = game.ui;
});
