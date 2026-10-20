// src/types/game.ts

export type GameMode = 'classic' | 'sand';

// Backward compatibility for existing multi-mode options (classic, daily, puzzle, sand)
export type GameModeType = 'classic' | 'daily' | 'puzzle' | 'sand';

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'BOMB';

export interface Cell {
  filled: boolean;
  color: string;
  type?: TetrominoType;
  bombTimer?: number;
}

export type BoardGrid = Cell[][];

// Representasi Sand Grid High-Resolution (Flat TypedArrays untuk performa 60fps)
export interface SandGridState {
  width: number;       // 60 (10 kolom * 6 sub-sel)
  height: number;      // 120 (20 baris * 6 sub-sel)
  scale: number;       // 6 sub-sel per blok Tetris
  /**
   * 0 = kosong, 1..7 = ID warna palet, 8 = BOMB grain
   */
  cells: Uint8Array;
  /**
   * Menyimpan variasi kecerahan/tekstur tiap butir pasir (0..255)
   * agar tampilan pasir organik dan berkilau seperti permen/kristal.
   */
  shade: Uint8Array;
  /**
   * Penanda apakah butir pasir sudah diupdate pada tick ini
   */
  updated: Uint8Array;
}

export interface ClearedSandCluster {
  colorId: number;
  colorHex: string;
  indices: number[]; // Indeks di dalam SandGridState.cells
  centroidX: number; // Dalam koordinat board (0..10) untuk popup skor & partikel
  centroidY: number; // Dalam koordinat board (0..20)
}

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  level?: number;
  lines?: number;
  mode?: GameMode | string;
  date: string;
}

export type GameStatusType = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export const GameStatus = {
  IDLE: 'IDLE' as GameStatusType,
  PLAYING: 'PLAYING' as GameStatusType,
  PAUSED: 'PAUSED' as GameStatusType,
  GAME_OVER: 'GAME_OVER' as GameStatusType
};

export type ThemeId = 'candy' | 'neon' | 'pastel' | 'retro';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  renderStyle: 'glossy' | 'neon' | 'pastel' | 'retro';
  badge: string;
  colors: Record<string, string>;
}

export interface TetrominoDef {
  shape: number[][];
  color: string;
  highlight: string;
  isBomb?: boolean;
}

export interface ActivePiece {
  type: string;
  matrix: number[][];
  color: string;
  highlight: string;
  isBomb: boolean;
  x: number;
  y: number;
}

export interface PuzzleStage {
  id: number;
  name: string;
  targetLines: number;
  pieceQueue: string[];
  setup: (board: (string | number)[][]) => void;
}
