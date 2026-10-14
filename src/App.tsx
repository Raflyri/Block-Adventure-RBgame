import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameModeType,
  GameStatusType,
  ThemeId,
  ActivePiece,
  LeaderboardEntry
} from './types/game';
import {
  COLS,
  ROWS,
  THEMES,
  BASE_TETROMINOES,
  CLASSIC_PIECE_KEYS,
  LINE_POINTS,
  PUZZLE_STAGES
} from './constants/game';
import { sfx } from './services/audio';
import { particles } from './services/particles';
import { CanvasRenderer } from './services/renderer';
import { LeaderboardService } from './services/leaderboard';
import { getTodayDateString, getDateSeed, createMulberry32 } from './services/prng';

import { Header } from './components/Header';
import { StatsPanel } from './components/StatsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { GameBoard } from './components/GameBoard';
import { TouchControls } from './components/TouchControls';
import { StartModal } from './components/StartModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { ThemeModal } from './components/ThemeModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SkyBubbles } from './components/SkyBubbles';

export const App: React.FC = () => {
  // Theme State
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('rblock_theme') as ThemeId;
      return saved && THEMES[saved] ? saved : 'candy';
    } catch {
      return 'candy';
    }
  });

  // Mode & Stage State
  const [mode, setMode] = useState<GameModeType>('classic');
  const [selectedPuzzleStage, setSelectedPuzzleStage] = useState<number>(1);
  const [unlockedPuzzleStage, setUnlockedPuzzleStage] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
    } catch {
      return 1;
    }
  });
  const [dailyStreak, setDailyStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('rblock_daily_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Game Play State
  const [gameStatus, setGameStatus] = useState<GameStatusType>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved =
        localStorage.getItem('rblock_adventure_highscore') ||
        localStorage.getItem('webtetris_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [level, setLevel] = useState<number>(1);
  const [lines, setLines] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);

  // Pieces
  const [currentPiece, setCurrentPiece] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<ActivePiece | null>(null);
  const [holdPiece, setHoldPiece] = useState<string | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);

  // Puzzle / Daily specifics
  const [puzzleQueue, setPuzzleQueue] = useState<string[]>([]);
  const [puzzleTargetLines, setPuzzleTargetLines] = useState<number>(1);
  const dailyTargetLines = 15;

  // Board matrix
  const boardRef = useRef<(string | number)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );

  // Audio / Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isStartOpen, setIsStartOpen] = useState<boolean>(true);
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customBadge, setCustomBadge] = useState<string | null>(null);
  const [isThemeOpen, setIsThemeOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  // Floating Banner
  const [bannerInfo, setBannerInfo] = useState<{ text: string; isBomb: boolean; visible: boolean }>({
    text: '',
    isBomb: false,
    visible: false
  });
  const bannerTimerRef = useRef<any>(null);

  // PWA install
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  // Internal Logic Refs for RequestAnimationFrame
  const currentPieceRef = useRef<ActivePiece | null>(null);
  const nextPieceRef = useRef<ActivePiece | null>(null);
  const holdPieceRef = useRef<string | null>(null);
  const canHoldRef = useRef<boolean>(true);
  const gameStatusRef = useRef<GameStatusType>('IDLE');
  const levelRef = useRef<number>(1);
  const scoreRef = useRef<number>(0);
  const linesRef = useRef<number>(0);
  const comboStreakRef = useRef<number>(0);
  const modeRef = useRef<GameModeType>('classic');
  const puzzleStageRef = useRef<number>(1);
  const puzzleQueueRef = useRef<string[]>([]);
  const puzzleTargetLinesRef = useRef<number>(1);

  // Bomb fuse
  const bombFuseRemainingRef = useRef<number>(8000);
  const lastTickSecondRef = useRef<number>(8);
  const piecesSinceLastBombRef = useRef<number>(0);
  const bagRef = useRef<string[]>([]);
  const dailyPrngRef = useRef<(() => number) | null>(null);

  // Animation & Game loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blockSizeRef = useRef<number>(30);
  const dropCounterRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const shakeDurationRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);

  // Gamepad cache
  const gpPrevRef = useRef<any>({});

  // Sync state to refs
  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);
  useEffect(() => {
    nextPieceRef.current = nextPiece;
  }, [nextPiece]);
  useEffect(() => {
    holdPieceRef.current = holdPiece;
  }, [holdPiece]);
  useEffect(() => {
    canHoldRef.current = canHold;
  }, [canHold]);
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  useEffect(() => {
    comboStreakRef.current = comboStreak;
  }, [comboStreak]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    puzzleStageRef.current = selectedPuzzleStage;
  }, [selectedPuzzleStage]);
  useEffect(() => {
    puzzleQueueRef.current = puzzleQueue;
  }, [puzzleQueue]);
  useEffect(() => {
    puzzleTargetLinesRef.current = puzzleTargetLines;
  }, [puzzleTargetLines]);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    try {
      localStorage.setItem('rblock_theme', themeId);
    } catch {}
  }, [themeId]);

  // PWA Prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPromptRef.current) return;
    deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPwa(false);
    }
    deferredPromptRef.current = null;
  };

  // Screen Shake Trigger
  const triggerScreenShake = useCallback((isHeavy: boolean = false) => {
    shakeDurationRef.current = isHeavy ? 400 : 150;
    shakeIntensityRef.current = isHeavy ? 8 : 3.5;
  }, []);

  // Show Banner Trigger
  const triggerBanner = useCallback((clearedLines: number, combo: number) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    const labels: Record<number, string> = {
      1: combo > 1 ? `${combo}x COMBO! 🔥 +${100 + (combo - 1) * 50}` : 'YAY! +100 ⭐',
      2: combo > 1 ? `${combo}x DOUBLE! ⚡ +${300 + (combo - 1) * 50}` : 'AWESOME! +300 🌈',
      3: 'SUPER COMBO! +500 🚀',
      4: 'MEGA RBLOCK! +800 ★🎉'
    };
    setBannerInfo({
      text: labels[clearedLines] || `+${clearedLines * 100} ✨`,
      isBomb: false,
      visible: true
    });
    bannerTimerRef.current = setTimeout(() => {
      setBannerInfo((prev) => ({ ...prev, visible: false }));
    }, 1200);
  }, []);

  const triggerBombBanner = useCallback((bonus: number, count: number) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBannerInfo({
      text: `BOOM! 💣 +${bonus} (${count} Balok!)`,
      isBomb: true,
      visible: true
    });
    bannerTimerRef.current = setTimeout(() => {
      setBannerInfo((prev) => ({ ...prev, visible: false }));
    }, 1400);
  }, []);

  // Generate Piece logic
  const getNextPieceType = useCallback((): string | null => {
    if (modeRef.current === 'puzzle') {
      if (puzzleQueueRef.current.length > 0) {
        const next = puzzleQueueRef.current[0];
        const updated = puzzleQueueRef.current.slice(1);
        puzzleQueueRef.current = updated;
        setPuzzleQueue(updated);
        return next;
      }
      return null;
    }

    if (modeRef.current === 'daily') {
      if (bagRef.current.length === 0) {
        const prng = dailyPrngRef.current || Math.random;
        const newBag = [...CLASSIC_PIECE_KEYS];
        for (let i = newBag.length - 1; i > 0; i--) {
          const j = Math.floor(prng() * (i + 1));
          [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
        }
        bagRef.current = newBag;
      }
      return bagRef.current.pop() || 'I';
    }

    // Classic Bag Randomizer + Candy Bomb
    piecesSinceLastBombRef.current++;
    if (piecesSinceLastBombRef.current >= 16) {
      const chance = piecesSinceLastBombRef.current >= 24 ? 1.0 : 0.25;
      if (Math.random() < chance) {
        piecesSinceLastBombRef.current = 0;
        return 'BOMB';
      }
    }

    if (bagRef.current.length === 0) {
      const newBag = [...CLASSIC_PIECE_KEYS];
      for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
      }
      bagRef.current = newBag;
    }
    return bagRef.current.pop() || 'I';
  }, []);

  const createPieceFromType = useCallback((type: string | null): ActivePiece | null => {
    if (!type) return null;
    const def = BASE_TETROMINOES[type];
    if (!def) return null;
    const themeColors = THEMES[themeId]?.colors;
    const pieceColor = (themeColors && themeColors[type]) || def.color;

    return {
      type,
      matrix: def.shape.map((row) => [...row]),
      color: pieceColor,
      highlight: def.highlight,
      isBomb: !!def.isBomb,
      x: Math.floor((COLS - def.shape[0].length) / 2),
      y: 0
    };
  }, [themeId]);

  const getBombFuseDuration = (lvl: number) => {
    switch (lvl) {
      case 1: return 8000;
      case 2: return 6500;
      case 3: return 5000;
      case 4: return 4000;
      default: return Math.max(2500, 3500 - (lvl - 5) * 200);
    }
  };

  const initBombFuse = useCallback((piece: ActivePiece | null) => {
    if (piece && piece.isBomb) {
      const duration = getBombFuseDuration(levelRef.current);
      bombFuseRemainingRef.current = duration;
      lastTickSecondRef.current = Math.ceil(duration / 1000);
      sfx.playFuseTick(false);
    }
  }, []);

  // Collision Checking
  const checkCollision = useCallback(
    (piece: ActivePiece, offsetX: number = 0, offsetY: number = 0, testMatrix: number[][] | null = null): boolean => {
      const matrix = testMatrix || piece.matrix;
      const targetX = piece.x + offsetX;
      const targetY = piece.y + offsetY;
      const board = boardRef.current;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const bx = targetX + c;
            const by = targetY + r;

            if (bx < 0 || bx >= COLS) return true;
            if (by >= ROWS) return true;
            if (by < 0) continue;
            if (board[by][bx] !== 0) return true;
          }
        }
      }
      return false;
    },
    []
  );

  // Victory / GameOver
  const handleVictory = useCallback((title: string, badge: string) => {
    gameStatusRef.current = 'GAME_OVER';
    setGameStatus('GAME_OVER');
    sfx.playVictory();

    if (canvasRef.current) {
      particles.spawnMegaRBlockBurst(canvasRef.current.width, canvasRef.current.height);
    }

    if (modeRef.current === 'daily') {
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
        setDailyStreak(streak);
      }
    }

    setIsVictory(true);
    setCustomTitle(title);
    setCustomBadge(badge);
    setIsGameOverOpen(true);
  }, []);

  const handleGameOver = useCallback((title?: string, badge?: string) => {
    gameStatusRef.current = 'GAME_OVER';
    setGameStatus('GAME_OVER');
    sfx.playGameOver();
    setIsVictory(false);
    setCustomTitle(title || null);
    setCustomBadge(badge || null);
    setIsGameOverOpen(true);
  }, []);

  // Line Clear
  const clearLines = useCallback((): number => {
    let cleared = 0;
    const board = boardRef.current;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((cell) => cell !== 0)) {
        cleared++;
        particles.spawnLineClearDebris(r, board[r], blockSizeRef.current);
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        r++;
      }
    }
    return cleared;
  }, []);

  // Detonate Bomb
  const detonateBomb = useCallback(
    (centerX: number, centerY: number) => {
      sfx.playExplosion();
      triggerScreenShake(true);

      const px = centerX * blockSizeRef.current + blockSizeRef.current / 2;
      const py = centerY * blockSizeRef.current + blockSizeRef.current / 2;
      particles.spawnBombExplosion(px, py);

      let destroyedCount = 0;
      const board = boardRef.current;
      for (let r = centerY - 1; r <= centerY + 1; r++) {
        for (let c = centerX - 1; c <= centerX + 1; c++) {
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            if (board[r][c] !== 0) {
              destroyedCount++;
              board[r][c] = 0;
            }
          }
        }
      }

      // Collapse floating blocks
      for (let c = 0; c < COLS; c++) {
        let emptyY = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][c] !== 0) {
            if (r !== emptyY) {
              board[emptyY][c] = board[r][c];
              board[r][c] = 0;
            }
            emptyY--;
          }
        }
      }

      const blastBonus = 250 + destroyedCount * 45;
      const newScore = scoreRef.current + blastBonus;
      scoreRef.current = newScore;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        try {
          localStorage.setItem('rblock_adventure_highscore', newScore.toString());
        } catch {}
      }

      triggerBombBanner(blastBonus, destroyedCount);

      const cleared = clearLines();
      if (cleared > 0) {
        sfx.playLineClear(cleared === 4);
        const combo = comboStreakRef.current + 1;
        comboStreakRef.current = combo;
        setComboStreak(combo);

        const basePoints = LINE_POINTS[cleared] || cleared * 100;
        const comboBonus = (combo - 1) * 50;
        const total = scoreRef.current + basePoints + comboBonus;
        scoreRef.current = total;
        setScore(total);
        if (total > highScore) {
          setHighScore(total);
          try {
            localStorage.setItem('rblock_adventure_highscore', total.toString());
          } catch {}
        }

        const newLines = linesRef.current + cleared;
        linesRef.current = newLines;
        setLines(newLines);

        const newLvl = Math.floor(total / 1000) + 1;
        levelRef.current = newLvl;
        setLevel(newLvl);

        triggerBanner(cleared, combo);
        if (cleared === 4 && canvasRef.current) {
          particles.spawnMegaRBlockBurst(canvasRef.current.width, canvasRef.current.height);
          triggerScreenShake(true);
        }
      }

      // Win Conditions
      if (modeRef.current === 'daily' && linesRef.current >= dailyTargetLines) {
        handleVictory('Tantangan Harian Selesai! 🎉', 'DAILY CHAMPION!');
        return;
      }
      if (modeRef.current === 'puzzle' && linesRef.current >= puzzleTargetLinesRef.current) {
        const curUnlocked = parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
        if (puzzleStageRef.current >= curUnlocked && puzzleStageRef.current < PUZZLE_STAGES.length) {
          localStorage.setItem('rblock_puzzle_unlocked', (puzzleStageRef.current + 1).toString());
          setUnlockedPuzzleStage(puzzleStageRef.current + 1);
        }
        handleVictory(`Stage ${puzzleStageRef.current} Berhasil! 🌟`, 'STAGE CLEARED!');
        return;
      }

      // Advance Piece
      let nxt = nextPieceRef.current;
      const generated = createPieceFromType(getNextPieceType());
      nextPieceRef.current = generated;
      setNextPiece(generated);

      if (!nxt && modeRef.current === 'puzzle') {
        if (holdPieceRef.current) {
          const temp = holdPieceRef.current;
          holdPieceRef.current = null;
          setHoldPiece(null);
          nxt = createPieceFromType(temp);
        } else {
          handleGameOver('Antrian Balok Habis! 🧩', 'STAGE FAILED');
          return;
        }
      }

      currentPieceRef.current = nxt;
      setCurrentPiece(nxt);
      canHoldRef.current = true;
      setCanHold(true);
      initBombFuse(nxt);

      if (nxt && checkCollision(nxt, 0, 0)) {
        handleGameOver();
      }
    },
    [
      triggerScreenShake,
      triggerBombBanner,
      clearLines,
      highScore,
      triggerBanner,
      dailyTargetLines,
      handleVictory,
      createPieceFromType,
      getNextPieceType,
      initBombFuse,
      checkCollision,
      handleGameOver
    ]
  );

  // Lock Current Piece
  const lockCurrentPiece = useCallback(() => {
    const cur = currentPieceRef.current;
    if (!cur) return;

    if (cur.isBomb) {
      detonateBomb(cur.x, cur.y);
      return;
    }

    const { matrix, x, y, color } = cur;
    const board = boardRef.current;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const by = y + r;
          const bx = x + c;
          if (by < 0) {
            handleGameOver();
            return;
          }
          board[by][bx] = color;
        }
      }
    }

    sfx.playDrop();

    const cleared = clearLines();
    if (cleared > 0) {
      sfx.playLineClear(cleared === 4);
      const combo = comboStreakRef.current + 1;
      comboStreakRef.current = combo;
      setComboStreak(combo);

      const basePoints = LINE_POINTS[cleared] || cleared * 100;
      const comboBonus = (combo - 1) * 50;
      const total = scoreRef.current + basePoints + comboBonus;
      scoreRef.current = total;
      setScore(total);
      if (total > highScore) {
        setHighScore(total);
        try {
          localStorage.setItem('rblock_adventure_highscore', total.toString());
        } catch {}
      }

      const newLines = linesRef.current + cleared;
      linesRef.current = newLines;
      setLines(newLines);

      const newLvl = Math.floor(total / 1000) + 1;
      levelRef.current = newLvl;
      setLevel(newLvl);

      triggerBanner(cleared, combo);
      if (cleared === 4 && canvasRef.current) {
        particles.spawnMegaRBlockBurst(canvasRef.current.width, canvasRef.current.height);
        triggerScreenShake(true);
      }
    } else {
      comboStreakRef.current = 0;
      setComboStreak(0);
    }

    // Win Conditions
    if (modeRef.current === 'daily' && linesRef.current >= dailyTargetLines) {
      handleVictory('Tantangan Harian Selesai! 🎉', 'DAILY CHAMPION!');
      return;
    }
    if (modeRef.current === 'puzzle' && linesRef.current >= puzzleTargetLinesRef.current) {
      const curUnlocked = parseInt(localStorage.getItem('rblock_puzzle_unlocked') || '1', 10);
      if (puzzleStageRef.current >= curUnlocked && puzzleStageRef.current < PUZZLE_STAGES.length) {
        localStorage.setItem('rblock_puzzle_unlocked', (puzzleStageRef.current + 1).toString());
        setUnlockedPuzzleStage(puzzleStageRef.current + 1);
      }
      handleVictory(`Stage ${puzzleStageRef.current} Berhasil! 🌟`, 'STAGE CLEARED!');
      return;
    }

    // Next Piece
    let nxt = nextPieceRef.current;
    const generated = createPieceFromType(getNextPieceType());
    nextPieceRef.current = generated;
    setNextPiece(generated);

    if (!nxt && modeRef.current === 'puzzle') {
      if (holdPieceRef.current) {
        const temp = holdPieceRef.current;
        holdPieceRef.current = null;
        setHoldPiece(null);
        nxt = createPieceFromType(temp);
      } else {
        handleGameOver('Antrian Balok Habis! 🧩', 'STAGE FAILED');
        return;
      }
    }

    currentPieceRef.current = nxt;
    setCurrentPiece(nxt);
    canHoldRef.current = true;
    setCanHold(true);
    initBombFuse(nxt);

    if (nxt && checkCollision(nxt, 0, 0)) {
      handleGameOver();
    }
  }, [
    detonateBomb,
    clearLines,
    highScore,
    triggerBanner,
    triggerScreenShake,
    dailyTargetLines,
    handleVictory,
    createPieceFromType,
    getNextPieceType,
    initBombFuse,
    checkCollision,
    handleGameOver
  ]);

  // Movement Actions
  const moveLeft = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    if (!checkCollision(piece, -1, 0)) {
      piece.x--;
      setCurrentPiece({ ...piece });
      sfx.playMove();
    }
  }, [checkCollision]);

  const moveRight = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    if (!checkCollision(piece, 1, 0)) {
      piece.x++;
      setCurrentPiece({ ...piece });
      sfx.playMove();
    }
  }, [checkCollision]);

  const softDrop = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    if (!checkCollision(piece, 0, 1)) {
      piece.y++;
      setCurrentPiece({ ...piece });
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
    } else {
      lockCurrentPiece();
    }
  }, [checkCollision, lockCurrentPiece]);

  const hardDrop = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    let dist = 0;
    while (!checkCollision(piece, 0, 1)) {
      piece.y++;
      dist++;
    }
    const newScore = scoreRef.current + dist * 2;
    scoreRef.current = newScore;
    setScore(newScore);
    setCurrentPiece({ ...piece });
    lockCurrentPiece();
    triggerScreenShake(false);
  }, [checkCollision, lockCurrentPiece, triggerScreenShake]);

  const rotate = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    if (piece.type === 'O' || piece.isBomb) return;

    const original = piece.matrix;
    const rotated = original[0].map((_, i) => original.map((row) => row[i]).reverse());

    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(piece, kick, 0, rotated)) {
        piece.matrix = rotated;
        piece.x += kick;
        setCurrentPiece({ ...piece });
        sfx.playRotate();
        return;
      }
    }
  }, [checkCollision]);

  const hold = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !canHoldRef.current || !currentPieceRef.current)
      return;

    sfx.playChime(620, 0.08, 'sine', 0.1);
    const curType = currentPieceRef.current.type;

    if (!holdPieceRef.current) {
      if (!nextPieceRef.current) return;
      holdPieceRef.current = curType;
      setHoldPiece(curType);

      const nxt = nextPieceRef.current;
      currentPieceRef.current = nxt;
      setCurrentPiece(nxt);

      const generated = createPieceFromType(getNextPieceType());
      nextPieceRef.current = generated;
      setNextPiece(generated);
    } else {
      const prevHold = holdPieceRef.current;
      holdPieceRef.current = curType;
      setHoldPiece(curType);

      const swapped = createPieceFromType(prevHold);
      currentPieceRef.current = swapped;
      setCurrentPiece(swapped);
    }

    canHoldRef.current = false;
    setCanHold(false);
    initBombFuse(currentPieceRef.current);
  }, [createPieceFromType, getNextPieceType, initBombFuse]);

  // Start / Reset Game
  const startGame = useCallback(
    (modeToStart: GameModeType = mode, stageToStart: number = selectedPuzzleStage) => {
      sfx.init();
      modeRef.current = modeToStart;
      setMode(modeToStart);

      // Reset Board
      const newBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      boardRef.current = newBoard;

      bagRef.current = [];
      piecesSinceLastBombRef.current = 0;
      comboStreakRef.current = 0;
      setComboStreak(0);
      scoreRef.current = 0;
      setScore(0);
      levelRef.current = 1;
      setLevel(1);
      linesRef.current = 0;
      setLines(0);
      holdPieceRef.current = null;
      setHoldPiece(null);
      canHoldRef.current = true;
      setCanHold(true);

      if (modeToStart === 'daily') {
        const seed = getDateSeed(getTodayDateString());
        const prng = createMulberry32(seed);
        dailyPrngRef.current = prng;

        for (let r = 16; r < ROWS; r++) {
          const holeCol1 = Math.floor(prng() * COLS);
          const holeCol2 = Math.floor(prng() * COLS);
          const holeCol3 = Math.floor(prng() * COLS);

          for (let c = 0; c < COLS; c++) {
            if (c !== holeCol1 && c !== holeCol2 && c !== holeCol3) {
              const colors = ['#00e5ff', '#ffbe0b', '#06d6a0', '#ff4d6d', '#a370f7'];
              const colorIdx = Math.floor(prng() * colors.length);
              newBoard[r][c] = colors[colorIdx];
            }
          }
        }
      } else if (modeToStart === 'puzzle') {
        puzzleStageRef.current = stageToStart;
        setSelectedPuzzleStage(stageToStart);
        const stageDef = PUZZLE_STAGES[stageToStart - 1] || PUZZLE_STAGES[0];
        stageDef.setup(newBoard);
        puzzleTargetLinesRef.current = stageDef.targetLines;
        setPuzzleTargetLines(stageDef.targetLines);
        const queueCopy = [...stageDef.pieceQueue];
        puzzleQueueRef.current = queueCopy;
        setPuzzleQueue(queueCopy);
      }

      const p1 = createPieceFromType(getNextPieceType());
      const p2 = createPieceFromType(getNextPieceType());
      currentPieceRef.current = p1;
      setCurrentPiece(p1);
      nextPieceRef.current = p2;
      setNextPiece(p2);

      initBombFuse(p1);

      gameStatusRef.current = 'PLAYING';
      setGameStatus('PLAYING');

      setIsStartOpen(false);
      setIsPauseOpen(false);
      setIsGameOverOpen(false);
      setIsLeaderboardOpen(false);
      setIsThemeOpen(false);

      dropCounterRef.current = 0;
    },
    [mode, selectedPuzzleStage, createPieceFromType, getNextPieceType, initBombFuse]
  );

  const pauseGame = useCallback(() => {
    if (gameStatusRef.current === 'PLAYING') {
      gameStatusRef.current = 'PAUSED';
      setGameStatus('PAUSED');
      setIsPauseOpen(true);
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameStatusRef.current === 'PAUSED') {
      gameStatusRef.current = 'PLAYING';
      setGameStatus('PLAYING');
      setIsPauseOpen(false);
      lastTimeRef.current = performance.now();
    }
  }, []);

  const togglePause = useCallback(() => {
    if (gameStatusRef.current === 'PLAYING') pauseGame();
    else if (gameStatusRef.current === 'PAUSED') resumeGame();
  }, [pauseGame, resumeGame]);

  const toggleAudio = useCallback(() => {
    sfx.init();
    const muted = sfx.toggleMute();
    setIsMuted(muted);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatusRef.current === 'GAME_OVER') return;

      if (e.keyCode === 10009 || e.keyCode === 461) {
        togglePause();
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Enter':
          rotate();
          break;
        case 'ArrowDown':
        case 'KeyS':
          softDrop();
          dropCounterRef.current = 0;
          break;
        case 'Space':
          e.preventDefault();
          hardDrop();
          dropCounterRef.current = 0;
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          hold();
          break;
        case 'KeyP':
        case 'Escape':
          togglePause();
          break;
        case 'KeyM':
          toggleAudio();
          break;
        case 'KeyL':
          if (gameStatusRef.current === 'PLAYING') pauseGame();
          setIsLeaderboardOpen(true);
          break;
        case 'KeyT':
          if (gameStatusRef.current === 'PLAYING') pauseGame();
          setIsThemeOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, rotate, softDrop, hardDrop, hold, togglePause, toggleAudio, pauseGame]);

  // Canvas Touch gestures
  const touchTrackRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    isActive: false
  });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStatusRef.current !== 'PLAYING') return;
    sfx.init();
    const touch = e.touches[0];
    touchTrackRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: performance.now(),
      isActive: true
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchTrackRef.current.isActive || gameStatusRef.current !== 'PLAYING') return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchTrackRef.current.lastX;
    const dy = touch.clientY - touchTrackRef.current.lastY;
    const threshold = blockSizeRef.current * 0.85;

    if (Math.abs(dx) >= threshold) {
      if (dx > 0) moveRight();
      else moveLeft();
      touchTrackRef.current.lastX = touch.clientX;
    }

    if (dy >= threshold) {
      softDrop();
      dropCounterRef.current = 0;
      touchTrackRef.current.lastY = touch.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchTrackRef.current.isActive || gameStatusRef.current !== 'PLAYING') return;
    touchTrackRef.current.isActive = false;

    const touch = e.changedTouches[0];
    const totalDx = touch.clientX - touchTrackRef.current.startX;
    const totalDy = touch.clientY - touchTrackRef.current.startY;
    const duration = performance.now() - touchTrackRef.current.startTime;

    if (Math.abs(totalDx) < 14 && Math.abs(totalDy) < 14 && duration < 240) {
      rotate();
      return;
    }

    if (totalDy > blockSizeRef.current * 1.8 && duration < 280) {
      hardDrop();
      dropCounterRef.current = 0;
    }
  };

  // Canvas Resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    let targetBlock = Math.floor(Math.min(rect.width / COLS, rect.height / ROWS));
    targetBlock = Math.max(16, targetBlock);
    blockSizeRef.current = targetBlock;

    const w = targetBlock * COLS;
    const h = targetBlock * ROWS;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    }

    if (particlesCanvasRef.current) {
      particles.setCanvas(particlesCanvasRef.current);
      particles.resize(w, h);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main Game Loop
  useEffect(() => {
    const loop = (currentTime: number) => {
      const delta = currentTime - (lastTimeRef.current || currentTime);
      lastTimeRef.current = currentTime;

      // Screen Shake
      if (shakeDurationRef.current > 0 && canvasRef.current) {
        shakeDurationRef.current -= delta;
        const ox = (Math.random() - 0.5) * shakeIntensityRef.current;
        const oy = (Math.random() - 0.5) * shakeIntensityRef.current;
        canvasRef.current.style.transform = `translate(${ox}px, ${oy}px)`;
        if (shakeDurationRef.current <= 0) {
          canvasRef.current.style.transform = 'none';
        }
      }

      if (gameStatusRef.current === 'PLAYING') {
        // Candy Bomb Fuse
        const cur = currentPieceRef.current;
        if (cur && cur.isBomb) {
          bombFuseRemainingRef.current -= delta;
          const currentSec = Math.ceil(bombFuseRemainingRef.current / 1000);
          if (currentSec !== lastTickSecondRef.current && currentSec > 0) {
            lastTickSecondRef.current = currentSec;
            sfx.playFuseTick(currentSec <= 3);
          }
          if (bombFuseRemainingRef.current <= 0) {
            detonateBomb(cur.x, cur.y);
            dropCounterRef.current = 0;
          }
        }

        // Automatic Drop
        dropCounterRef.current += delta;
        const dropInterval = Math.max(80, 1000 - (levelRef.current - 1) * 90);
        if (dropCounterRef.current >= dropInterval) {
          softDrop();
          dropCounterRef.current = 0;
        }
      }

      // Gamepad Polling
      if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        let gp: Gamepad | null = null;
        if (gamepads) {
          for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i]?.connected) {
              gp = gamepads[i];
              break;
            }
          }
        }
        if (gp) {
          const prev = gpPrevRef.current;
          const left = (gp.buttons[14] && gp.buttons[14].pressed) || gp.axes[0] < -0.45;
          const right = (gp.buttons[15] && gp.buttons[15].pressed) || gp.axes[0] > 0.45;
          const down = (gp.buttons[13] && gp.buttons[13].pressed) || gp.axes[1] > 0.45;
          const up = (gp.buttons[12] && gp.buttons[12].pressed) || gp.axes[1] < -0.45;
          const btnA = gp.buttons[0] && gp.buttons[0].pressed;
          const btnY = gp.buttons[3] && gp.buttons[3].pressed;
          const btnB = gp.buttons[1] && gp.buttons[1].pressed;
          const start = gp.buttons[9] && gp.buttons[9].pressed;

          if (gameStatusRef.current === 'PLAYING') {
            if (start && !prev.start) pauseGame();
            if ((up && !prev.up) || (btnA && !prev.btnA)) rotate();
            if (btnY && !prev.btnY) hardDrop();
            if (btnB && !prev.btnB) hold();
            if (left && !prev.left) moveLeft();
            if (right && !prev.right) moveRight();
            if (down && !prev.down) softDrop();
          } else if (gameStatusRef.current === 'PAUSED' && start && !prev.start) {
            resumeGame();
          }
          gpPrevRef.current = { left, right, down, up, btnA, btnY, btnB, start };
        }
      }

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const bs = blockSizeRef.current;
          const w = bs * COLS;
          const h = bs * ROWS;

          ctx.clearRect(0, 0, w, h);
          CanvasRenderer.drawGrid(ctx, w, h, bs, themeId);
          CanvasRenderer.drawBoard(ctx, boardRef.current, bs, themeId);

          if (gameStatusRef.current === 'PLAYING' || gameStatusRef.current === 'PAUSED') {
            const piece = currentPieceRef.current;
            if (piece) {
              // Ghost Piece
              if (gameStatusRef.current === 'PLAYING') {
                let gy = piece.y;
                while (!checkCollision(piece, 0, gy - piece.y + 1)) {
                  gy++;
                }
                CanvasRenderer.drawGhostPiece(
                  ctx,
                  { x: piece.x, y: gy, matrix: piece.matrix, color: piece.color, isBomb: piece.isBomb },
                  bs
                );
              }

              // Active Piece
              CanvasRenderer.drawPiece(
                ctx,
                piece,
                bs,
                themeId,
                piece.isBomb ? bombFuseRemainingRef.current : null
              );
            }
          }
        }
      }

      // Update Particle VFX
      particles.updateAndDraw();

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [
    themeId,
    detonateBomb,
    softDrop,
    checkCollision,
    pauseGame,
    resumeGame,
    rotate,
    hardDrop,
    hold,
    moveLeft,
    moveRight
  ]);

  const handleSubmitScore = async (name: string) => {
    const modeToSubmit = mode === 'daily' ? 'daily' : 'classic';
    return await LeaderboardService.submitScore(name, score, modeToSubmit);
  };

  const puzzleRemainingQueueCount =
    puzzleQueue.length + (currentPiece ? 1 : 0) + (nextPiece ? 1 : 0) + (holdPiece ? 1 : 0);

  return (
    <>
      <SkyBubbles />

      <div className="app-container" id="app-container">
        <Header
          themeConfig={THEMES[themeId]}
          isMuted={isMuted}
          isPaused={gameStatus === 'PAUSED'}
          canInstallPwa={canInstallPwa}
          onInstallPwa={handleInstallPwa}
          onOpenTheme={() => {
            if (gameStatus === 'PLAYING') pauseGame();
            setIsThemeOpen(true);
          }}
          onOpenLeaderboard={() => {
            if (gameStatus === 'PLAYING') pauseGame();
            setIsLeaderboardOpen(true);
          }}
          onToggleAudio={toggleAudio}
          onTogglePause={togglePause}
        />

        <main className="game-arena" id="game-arena">
          <StatsPanel
            score={score}
            highScore={highScore}
            level={level}
            lines={lines}
            mode={mode}
            puzzleStage={selectedPuzzleStage}
            puzzleTargetLines={puzzleTargetLines}
            puzzleQueueCount={puzzleRemainingQueueCount}
            dailyTargetLines={dailyTargetLines}
            holdPiece={holdPiece}
            themeId={themeId}
          />

          <GameBoard
            canvasRef={canvasRef}
            particlesCanvasRef={particlesCanvasRef}
            bannerInfo={bannerInfo}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          <PreviewPanel
            nextPiece={nextPiece}
            holdPiece={holdPiece}
            lines={lines}
            themeId={themeId}
          />
        </main>

        <TouchControls
          onMoveLeft={moveLeft}
          onMoveRight={moveRight}
          onSoftDrop={() => {
            softDrop();
            dropCounterRef.current = 0;
          }}
          onRotate={rotate}
          onHardDrop={() => {
            hardDrop();
            dropCounterRef.current = 0;
          }}
          onHold={hold}
        />

        <footer className="app-footer">
          <p>
            Built with ❤️ • Created by <span className="cf-tag">rbeverything.com</span>
          </p>
        </footer>
      </div>

      <StartModal
        isOpen={isStartOpen}
        selectedMode={mode}
        selectedStage={selectedPuzzleStage}
        unlockedStage={unlockedPuzzleStage}
        dailyStreak={dailyStreak}
        onSelectMode={(m) => setMode(m)}
        onSelectStage={(stg) => setSelectedPuzzleStage(stg)}
        onStartGame={() => startGame(mode, selectedPuzzleStage)}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onResume={resumeGame}
        onRestart={() => startGame(mode, selectedPuzzleStage)}
        onMainMenu={() => {
          setIsPauseOpen(false);
          setIsStartOpen(true);
          gameStatusRef.current = 'IDLE';
          setGameStatus('IDLE');
        }}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        isVictory={isVictory}
        score={score}
        level={level}
        lines={lines}
        mode={mode}
        puzzleStage={selectedPuzzleStage}
        customTitle={customTitle}
        customBadge={customBadge}
        onSubmitScore={handleSubmitScore}
        onPlayAgain={() => startGame(mode, selectedPuzzleStage)}
        onNextStage={() => {
          const next = selectedPuzzleStage + 1;
          if (next <= PUZZLE_STAGES.length) {
            setSelectedPuzzleStage(next);
            startGame('puzzle', next);
          }
        }}
        onChooseStage={() => {
          setIsGameOverOpen(false);
          setMode('puzzle');
          setIsStartOpen(true);
        }}
        onViewLeaderboard={() => {
          setIsLeaderboardOpen(true);
        }}
        onMainMenu={() => {
          setIsGameOverOpen(false);
          setIsStartOpen(true);
          gameStatusRef.current = 'IDLE';
          setGameStatus('IDLE');
        }}
      />

      <ThemeModal
        isOpen={isThemeOpen}
        currentTheme={themeId}
        onSelectTheme={(t) => setThemeId(t)}
        onClose={() => setIsThemeOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </>
  );
};
