import { ThemeConfig, ThemeId, TetrominoDef, PuzzleStage, LeaderboardEntry } from '../types/game';

export const COLS = 10;
export const ROWS = 20;

export const CLASSIC_PIECE_KEYS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const LINE_POINTS: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

export const THEMES: Record<ThemeId, ThemeConfig> = {
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

export const BASE_TETROMINOES: Record<string, TetrominoDef> = {
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

export const PUZZLE_STAGES: PuzzleStage[] = [
  {
    id: 1,
    name: "Teka-Teki Pembuka",
    targetLines: 1,
    pieceQueue: ['I', 'O', 'T', 'J'],
    setup: (board) => {
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

export const DEFAULT_CLASSIC_LEADERBOARD: LeaderboardEntry[] = [
  { name: "RB_Master", score: 12500, date: "2026-09-01T12:00:00.000Z" },
  { name: "CandyQueen", score: 9800, date: "2026-09-02T14:30:00.000Z" },
  { name: "JellyStar", score: 7450, date: "2026-09-03T09:15:00.000Z" },
  { name: "SparkyBlock", score: 5200, date: "2026-09-04T08:00:00.000Z" },
  { name: "ChocoBlast", score: 3800, date: "2026-09-04T11:45:00.000Z" },
  { name: "LittleGamer", score: 2500, date: "2026-09-04T15:20:00.000Z" },
  { name: "PixelKid", score: 1600, date: "2026-09-04T16:10:00.000Z" }
];

export const DEFAULT_DAILY_LEADERBOARD: LeaderboardEntry[] = [
  { name: "DailyHero", score: 4800, date: new Date().toISOString() },
  { name: "SpeedyBlock", score: 3950, date: new Date().toISOString() },
  { name: "PuzzleAce", score: 2900, date: new Date().toISOString() }
];
