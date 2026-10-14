export type GameModeType = 'classic' | 'daily' | 'puzzle';

export const GameMode = {
  CLASSIC: 'classic' as GameModeType,
  DAILY: 'daily' as GameModeType,
  PUZZLE: 'puzzle' as GameModeType
};

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

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  mode?: string;
}
