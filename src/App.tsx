import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  GameModeType,
  GameStatusType,
  ThemeId,
  ActivePiece,
  LeaderboardEntry,
  SandGridState
} from './types/game';
import {
  COLS,
  ROWS,
  THEMES,
  BASE_TETROMINOES,
  CLASSIC_PIECE_KEYS,
  LINE_POINTS,
  PUZZLE_STAGES,
  STONE_SPAWN_CHANCE
} from './constants/game';
import { sfx } from './services/audio';
import { haptics } from './services/haptics';
import { particles } from './services/particles';
import { CanvasRenderer } from './services/renderer';
import { LeaderboardService, getBestScore, saveBestScore } from './services/leaderboard';
import {
  createSandGrid,
  clearSandGrid,
  checkSandCollision,
  imprintPieceToSand,
  detonateSandBomb,
  stepSandPhysics,
  findAndClearSandBridges,
  isSandToppedOut,
  getSandPiecePool,
  getDominantSurfaceColor,
  getSandHighestY,
  getSandLevelPalette,
  getThemeColorIdMap,
  COLOR_ID_TO_TYPE,
  STONE_COLOR_ID,
  getClusterClearThreshold
} from './services/sandEngine';
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
import { SettingsModal, SENSITIVITY_LABELS } from './components/SettingsModal';
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

  // Dual Game Modes State & Sand Grid Ref
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    try {
      return (localStorage.getItem('rblock_game_mode') as GameMode) || 'classic';
    } catch {
      return 'classic';
    }
  });
  const gameModeRef = useRef<GameMode>(gameMode);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  const sandGridRef = useRef<SandGridState>(createSandGrid());
  const sandTickParityRef = useRef<number>(0);
  const sandCheckCooldownRef = useRef<number>(0);

  const [bestScoreClassic, setBestScoreClassic] = useState<number>(() => getBestScore('classic'));
  const [bestScoreSand, setBestScoreSand] = useState<number>(() => getBestScore('sand'));

  // Mode & Stage State
  const [mode, setMode] = useState<GameModeType>(() => {
    try {
      const savedMode = (localStorage.getItem('rblock_game_mode') as GameMode) || 'classic';
      return savedMode === 'sand' ? 'sand' : 'classic';
    } catch {
      return 'classic';
    }
  });
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
      const currentMode = (localStorage.getItem('rblock_game_mode') as GameMode) || 'classic';
      return getBestScore(currentMode);
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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Settings: Swipe sensitivity (1 to 5, default 3) & Screen Shake
  const [swipeSensitivity, setSwipeSensitivity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rblock_swipe_sensitivity');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 5) return parsed;
      }
    } catch {}
    return 3;
  });
  const swipeSensitivityRef = useRef<number>(3);
  useEffect(() => {
    swipeSensitivityRef.current = swipeSensitivity;
    try {
      localStorage.setItem('rblock_swipe_sensitivity', swipeSensitivity.toString());
    } catch {}
  }, [swipeSensitivity]);

  const [screenShakeEnabled, setScreenShakeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rblock_screen_shake');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });
  const screenShakeEnabledRef = useRef<boolean>(true);
  useEffect(() => {
    screenShakeEnabledRef.current = screenShakeEnabled;
    try {
      localStorage.setItem('rblock_screen_shake', screenShakeEnabled ? 'true' : 'false');
    } catch {}
  }, [screenShakeEnabled]);

  // Game Speed Multiplier (1.0 to 2.5, default 1.0)
  const [gameSpeedMultiplier, setGameSpeedMultiplier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rblock_game_speed_multiplier');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 3.0) {
          return parsed;
        }
      }
    } catch {}
    return 1.0;
  });
  const gameSpeedMultiplierRef = useRef<number>(1.0);
  useEffect(() => {
    gameSpeedMultiplierRef.current = gameSpeedMultiplier;
    try {
      localStorage.setItem('rblock_game_speed_multiplier', gameSpeedMultiplier.toString());
    } catch {}
  }, [gameSpeedMultiplier]);

  const handleGameSpeedChange = useCallback((newSpeed: number) => {
    const clamped = Math.max(1.0, Math.min(2.5, Math.round(newSpeed * 100) / 100));
    setGameSpeedMultiplier(clamped);
  }, []);

  // Sound Effects (SFX) Volume (0 to 100)
  const [sfxVolume, setSfxVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rblock_sfx_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          return Math.round(parsed * 100);
        }
      }
    } catch {}
    return Math.round(sfx.volume * 100);
  });

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, newVolume));
    setSfxVolume(clamped);
    sfx.setVolume(clamped / 100);
  }, []);

  const handleTestSfx = useCallback(() => {
    sfx.playVolumePreview();
  }, []);

  // Haptic Feedback (Vibration API)
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rblock_haptics_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const handleToggleHaptics = useCallback((val: boolean) => {
    setHapticsEnabled(val);
    haptics.setEnabled(val);
  }, []);

  const handleTestHaptics = useCallback(() => {
    haptics.test();
  }, []);

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
    if (!screenShakeEnabledRef.current) return;
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

  const triggerCustomBanner = useCallback((text: string, isBomb: boolean = false) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBannerInfo({
      text,
      isBomb,
      visible: true
    });
    bannerTimerRef.current = setTimeout(() => {
      setBannerInfo((prev) => ({ ...prev, visible: false }));
    }, 1400);
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

    // --- Sand Mode: Level-Based Dynamic Color Pool & Smart Surface Weighting ---
    if (gameModeRef.current === 'sand') {
      piecesSinceLastBombRef.current++;

      // Adaptive Bomb Lifeline: If sand pile is congested (reaches top 50%), spawn bomb faster
      const highestSandY = getSandHighestY(sandGridRef.current);
      const isCongested = highestSandY <= 60; // top 50% of 120 height
      const bombThreshold = isCongested ? 8 : 16;
      const mustBombThreshold = isCongested ? 14 : 24;

      if (piecesSinceLastBombRef.current >= bombThreshold) {
        const chance = piecesSinceLastBombRef.current >= mustBombThreshold ? 1.0 : (isCongested ? 0.45 : 0.25);
        if (Math.random() < chance) {
          piecesSinceLastBombRef.current = 0;
          return 'BOMB';
        }
      }

      // Phase 2: Stone (Dead Sand) Obstacle Mechanic (12% spawn chance)
      if (Math.random() < STONE_SPAWN_CHANCE) {
        return 'STONE';
      }

      if (bagRef.current.length === 0) {
        // Shapes are standard classic tetrominoes so full shape variety is preserved
        const newBag = [...CLASSIC_PIECE_KEYS];
        // Shuffle
        for (let i = newBag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
        }
        bagRef.current = newBag;
      }

      return bagRef.current.pop() || 'I';
    }

    // --- Classic Bag Randomizer + Candy Bomb ---
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

    if (gameModeRef.current === 'sand') {
      if (type === 'BOMB') {
        return {
          type,
          matrix: def.shape.map((row) => [...row]),
          color: '#ff2a2a',
          highlight: '#ff9900',
          isBomb: true,
          x: Math.floor((COLS - def.shape[0].length) / 2),
          y: 0,
          sandColorId: 8
        };
      }

      if (type === 'STONE') {
        const stoneShapes = [
          [[1, 1], [1, 1]], // 2x2 solid stone slab
          [[1, 1, 1], [0, 1, 0]], // T-shaped stone
          [[1, 1, 1, 1]], // 4x1 stone bar
          [[1, 1, 0], [0, 1, 1]] // Z-shaped stone
        ];
        const shape = stoneShapes[Math.floor(Math.random() * stoneShapes.length)];
        const themeColors = THEMES[themeId]?.colors;
        const stoneColor = (themeColors && themeColors.STONE) || '#64748b';

        return {
          type: 'STONE',
          matrix: shape.map((row) => [...row]),
          color: stoneColor,
          highlight: '#94a3b8',
          isBomb: false,
          isStone: true,
          x: Math.floor((COLS - shape[0].length) / 2),
          y: 0,
          sandColorId: STONE_COLOR_ID
        };
      }

      // Dynamic Color Progression for Sand Mode:
      // Assign sandColorId strictly from the active level's allowed color palette
      const palette = getSandLevelPalette(levelRef.current);
      const domColorId = getDominantSurfaceColor(sandGridRef.current, levelRef.current);
      let assignedColorId: number;

      // Smart Color Weighting / Bag Bias (Heuristic):
      // If a color dominates >= 35% of settled surface, give 50% chance to pick it
      if (domColorId && palette.allowedColorIds.includes(domColorId) && Math.random() < 0.5) {
        assignedColorId = domColorId;
      } else {
        const allowed = palette.allowedColorIds;
        assignedColorId = allowed[Math.floor(Math.random() * allowed.length)];
      }

      const colorTypeKey = COLOR_ID_TO_TYPE[assignedColorId] || type;
      const themeColors = THEMES[themeId]?.colors;
      const pieceColor = (themeColors && themeColors[colorTypeKey]) || BASE_TETROMINOES[colorTypeKey]?.color || def.color;
      const pieceHighlight = BASE_TETROMINOES[colorTypeKey]?.highlight || def.highlight;

      return {
        type,
        matrix: def.shape.map((row) => [...row]),
        color: pieceColor,
        highlight: pieceHighlight,
        isBomb: false,
        x: Math.floor((COLS - def.shape[0].length) / 2),
        y: 0,
        sandColorId: assignedColorId
      };
    }

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

  // Collision Checking (Classic & Sand)
  const checkCollision = useCallback(
    (piece: ActivePiece, offsetX: number = 0, offsetY: number = 0, testMatrix: number[][] | null = null): boolean => {
      const matrix = testMatrix || piece.matrix;
      const targetX = piece.x + offsetX;
      const targetY = piece.y + offsetY;

      if (gameModeRef.current === 'sand') {
        return checkSandCollision(sandGridRef.current, matrix, targetX, targetY);
      }

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
    haptics.victory();

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
    haptics.gameOver();
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
      haptics.bombExplosion();
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
        haptics.lineClear(cleared);
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

    if (gameModeRef.current === 'sand') {
      if (cur.isBomb) {
        const destroyed = detonateSandBomb(sandGridRef.current, cur.x, cur.y, 2.2);
        sfx.playBombExplosion();
        haptics.bombExplosion();
        triggerScreenShake(true);
        if (canvasRef.current) {
          const bs = blockSizeRef.current;
          particles.spawnBombExplosion(
            (cur.x + 0.5) * bs,
            (cur.y + 0.5) * bs
          );
        }
        if (destroyed > 0) {
          const earned = Math.floor(destroyed * 2);
          const total = scoreRef.current + earned;
          scoreRef.current = total;
          setScore(total);
          saveBestScore('sand', total);
          setBestScoreSand((prev) => Math.max(prev, total));
          setHighScore((prev) => Math.max(prev, total));
        }
      } else {
        const toppedOut = imprintPieceToSand(
          sandGridRef.current,
          cur.matrix,
          cur.x,
          cur.y,
          cur.type,
          cur.sandColorId
        );
        sfx.playDrop();
        haptics.pieceLock();

        if (toppedOut || isSandToppedOut(sandGridRef.current)) {
          handleGameOver('Tumpukan Pasir Mencapai Puncak! ⏳', 'GAME OVER');
          return;
        }
      }

      // Next Piece
      let nxt = nextPieceRef.current;
      const generated = createPieceFromType(getNextPieceType());
      nextPieceRef.current = generated;
      setNextPiece(generated);

      if (nxt && checkCollision(nxt, 0, 0)) {
        handleGameOver('Papan Penuh! Balok Terjepit.', 'GAME OVER');
        return;
      }

      currentPieceRef.current = nxt;
      setCurrentPiece(nxt);
      canHoldRef.current = true;
      initBombFuse(nxt);
      return;
    }

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
      haptics.lineClear(cleared);
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
      haptics.pieceLock();
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
      haptics.move();
    }
  }, [checkCollision]);

  const moveRight = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !currentPieceRef.current) return;
    const piece = currentPieceRef.current;
    if (!checkCollision(piece, 1, 0)) {
      piece.x++;
      setCurrentPiece({ ...piece });
      sfx.playMove();
      haptics.move();
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
      haptics.softDrop();
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
    haptics.hardDrop();
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
        haptics.rotate();
        return;
      }
    }
  }, [checkCollision]);

  const hold = useCallback(() => {
    if (gameStatusRef.current !== 'PLAYING' || !canHoldRef.current || !currentPieceRef.current)
      return;

    sfx.playChime(620, 0.08, 'sine', 0.1);
    haptics.hold();
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
      haptics.menuTap();
      modeRef.current = modeToStart;
      setMode(modeToStart);

      // Reset Board & Sand Grid
      const newBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      boardRef.current = newBoard;
      clearSandGrid(sandGridRef.current);
      sandTickParityRef.current = 0;
      sandCheckCooldownRef.current = 0;

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

  const getThemeColorIdMap = useCallback((theme: ThemeId): Record<number, string> => {
    const colors = THEMES[theme]?.colors || THEMES.candy.colors;
    return {
      1: colors.I || '#00e5ff',
      2: colors.J || '#4361ee',
      3: colors.L || '#ff7b00',
      4: colors.O || '#ffbe0b',
      5: colors.S || '#06d6a0',
      6: colors.T || '#a370f7',
      7: colors.Z || '#ff4d6d',
      8: colors.BOMB || '#ff2a2a'
    };
  }, []);

  const handleSelectGameMode = useCallback((newMode: GameMode) => {
    haptics.menuTap();
    setGameMode(newMode);
    gameModeRef.current = newMode;
    bagRef.current = [];
    piecesSinceLastBombRef.current = 0;
    try {
      localStorage.setItem('rblock_game_mode', newMode);
    } catch {}
    const best = getBestScore(newMode);
    setHighScore(best);
    if (newMode === 'sand') {
      setMode('sand');
      modeRef.current = 'sand';
    } else {
      setMode('classic');
      modeRef.current = 'classic';
    }
  }, []);

  const handleToggleGameMode = useCallback(() => {
    haptics.menuTap();
    const nextMode: GameMode = gameMode === 'classic' ? 'sand' : 'classic';
    handleSelectGameMode(nextMode);
    if (gameStatusRef.current === 'PLAYING') {
      startGame(nextMode === 'sand' ? 'sand' : 'classic', selectedPuzzleStage);
    }
  }, [gameMode, handleSelectGameMode, selectedPuzzleStage, startGame]);

  const pauseGame = useCallback(() => {
    if (gameStatusRef.current === 'PLAYING') {
      haptics.menuTap();
      gameStatusRef.current = 'PAUSED';
      setGameStatus('PAUSED');
      setIsPauseOpen(true);
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameStatusRef.current === 'PAUSED') {
      haptics.menuTap();
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
    haptics.menuTap();
    sfx.init();
    const muted = sfx.toggleMute();
    setIsMuted(muted);
  }, []);

  const openSettings = useCallback(() => {
    haptics.menuTap();
    if (gameStatusRef.current === 'PLAYING') pauseGame();
    setIsSettingsOpen(true);
  }, [pauseGame]);

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
        case 'KeyO':
          openSettings();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, rotate, softDrop, hardDrop, hold, togglePause, toggleAudio, pauseGame, openSettings]);

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

    // Dynamically computed threshold based on user's Swipe Sensitivity preference
    const sensitivityMultiplier =
      SENSITIVITY_LABELS[swipeSensitivityRef.current]?.multiplier || 0.85;
    const threshold = blockSizeRef.current * sensitivityMultiplier;

    if (Math.abs(dx) >= threshold) {
      if (dx > 0) moveRight();
      else moveLeft();
      touchTrackRef.current.lastX = touch.clientX;
    }

    const verticalThreshold = blockSizeRef.current * Math.min(1.0, sensitivityMultiplier * 1.1);
    if (dy >= verticalThreshold) {
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

        // Automatic Drop (Phase 3: Steeper speed curve for Sand Mode tension!)
        dropCounterRef.current += delta;
        const baseDropInterval = gameModeRef.current === 'sand'
          ? Math.max(70, 750 - (levelRef.current - 1) * 115) // Lv 1: 750ms -> Lv 3: 520ms -> Lv 5: 290ms -> Lv 7+: 70ms!
          : Math.max(80, 1000 - (levelRef.current - 1) * 90);
        const currentSpeed = gameSpeedMultiplierRef.current || 1.0;
        const dropInterval = Math.max(40, baseDropInterval / currentSpeed);
        if (dropCounterRef.current >= dropInterval) {
          softDrop();
          dropCounterRef.current = 0;
        }

        // Sand Physics Simulation & Bridge Clears
        if (gameModeRef.current === 'sand') {
          let anyMoved = false;
          for (let step = 0; step < 2; step++) {
            sandTickParityRef.current = (sandTickParityRef.current + 1) & 1;
            if (stepSandPhysics(sandGridRef.current, sandTickParityRef.current)) {
              anyMoved = true;
            }
          }

          sandCheckCooldownRef.current++;
          if (sandCheckCooldownRef.current >= 4 || !anyMoved) {
            sandCheckCooldownRef.current = 0;
            const paletteMap = getThemeColorIdMap(themeId);
            const clearedClusters = findAndClearSandBridges(sandGridRef.current, paletteMap, levelRef.current);

            if (clearedClusters.length > 0) {
              let totalGrainsCleared = 0;
              let totalStoneBroken = 0;
              let hasFull = false;
              let hasWide = false;
              let hasVertical = false;
              let hasMassive = false;
              const bs = blockSizeRef.current;

              clearedClusters.forEach((cluster) => {
                totalGrainsCleared += cluster.indices.length;
                if (cluster.clearedStoneGrainsCount) {
                  totalStoneBroken += cluster.clearedStoneGrainsCount;
                }
                if (cluster.clearType === 'full_span') hasFull = true;
                if (cluster.clearType === 'wide_span') hasWide = true;
                if (cluster.clearType === 'vertical_span') hasVertical = true;
                if (cluster.clearType === 'massive_cluster') hasMassive = true;

                for (let i = 0; i < cluster.indices.length; i += 6) {
                  const idx = cluster.indices[i];
                  const gx = (idx % sandGridRef.current.width) / sandGridRef.current.scale;
                  const gy = Math.floor(idx / sandGridRef.current.width) / sandGridRef.current.scale;
                  particles.spawnLineClearSparkle((gx + 0.5) * bs, (gy + 0.5) * bs, cluster.colorHex);
                }

                // Phase 2: Spawn stone crumbling particles for destroyed Dead Sand grains
                if (cluster.stoneIndices && cluster.stoneIndices.length > 0) {
                  for (let s = 0; s < cluster.stoneIndices.length; s += 3) {
                    const sIdx = cluster.stoneIndices[s];
                    const sx = (sIdx % sandGridRef.current.width) / sandGridRef.current.scale;
                    const sy = Math.floor(sIdx / sandGridRef.current.width) / sandGridRef.current.scale;
                    particles.spawnStoneCrumble((sx + 0.5) * bs, (sy + 0.5) * bs);
                  }
                }
              });

              const bridgesCount = clearedClusters.length;
              const basePoints = bridgesCount * 150 * levelRef.current;
              const grainBonus = Math.floor(totalGrainsCleared * 0.75) * levelRef.current;
              const comboBonus = (hasMassive || hasVertical) ? 250 * levelRef.current : 0;
              const stoneBonus = Math.floor(totalStoneBroken * 1.5) * levelRef.current;
              const totalEarned = basePoints + grainBonus + comboBonus + stoneBonus;

              const nextScore = scoreRef.current + totalEarned;
              scoreRef.current = nextScore;
              setScore(nextScore);
              saveBestScore('sand', nextScore);
              setBestScoreSand((prev) => Math.max(prev, nextScore));
              setHighScore((prev) => Math.max(prev, nextScore));

              const nextLines = linesRef.current + bridgesCount;
              linesRef.current = nextLines;
              setLines(nextLines);

              // Level up every 8 cleared spans/clusters in Sand Mode
              const nextLevel = Math.floor(nextLines / 8) + 1;
              if (nextLevel !== levelRef.current) {
                levelRef.current = nextLevel;
                setLevel(nextLevel);
                // When level increases, reset bag to incorporate new colors
                bagRef.current = [];
              }

              sfx.playLineClear(bridgesCount >= 2 || hasFull || hasVertical);
              haptics.sandBridgeClear(bridgesCount);
              triggerScreenShake(bridgesCount >= 2 || hasFull || hasMassive || hasVertical || totalStoneBroken > 20);

              const stoneTag = totalStoneBroken > 0 ? ` (+${totalStoneBroken} 🪨)` : '';
              if (hasFull) {
                triggerCustomBanner(`FULL BRIDGE! ⏳ +${totalEarned}${stoneTag}`);
              } else if (hasWide) {
                triggerCustomBanner(`WIDE SPAN! 🌈 +${totalEarned}${stoneTag}`);
              } else if (hasVertical) {
                triggerCustomBanner(`VERTICAL TOWER! ⚡ +${totalEarned}${stoneTag}`);
              } else if (hasMassive) {
                triggerCustomBanner(`MEGA BLOB! 💥 +${totalEarned} (${totalGrainsCleared} Butir${stoneTag}!)`);
              } else if (totalStoneBroken > 0) {
                triggerCustomBanner(`STONE CRUSHED! 🪨 +${totalEarned} (${totalStoneBroken} Batu!)`);
              } else {
                triggerBanner(bridgesCount, 1);
              }
            }
          }
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
          if (gameModeRef.current === 'sand') {
            const paletteMap = getThemeColorIdMap(themeId);
            CanvasRenderer.renderSandGrid(ctx, sandGridRef.current, w, h, paletteMap);
          } else {
            CanvasRenderer.drawBoard(ctx, boardRef.current, bs, themeId);
          }

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
                  { x: piece.x, y: gy, matrix: piece.matrix, color: piece.color, isBomb: piece.isBomb, isStone: piece.isStone },
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
    const modeToSubmit = mode === 'daily' ? 'daily' : mode === 'sand' ? 'sand' : 'classic';
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
          onOpenSettings={openSettings}
          onToggleAudio={toggleAudio}
          onTogglePause={togglePause}
          gameMode={gameMode}
          onToggleGameMode={handleToggleGameMode}
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
            gameSpeedMultiplier={gameSpeedMultiplier}
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
        onOpenSettings={openSettings}
        gameMode={gameMode}
        onSelectGameMode={handleSelectGameMode}
        bestScoreClassic={bestScoreClassic}
        bestScoreSand={bestScoreSand}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onResume={resumeGame}
        onRestart={() => startGame(mode, selectedPuzzleStage)}
        onOpenSettings={openSettings}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        swipeSensitivity={swipeSensitivity}
        onSwipeSensitivityChange={(val) => setSwipeSensitivity(val)}
        sfxVolume={sfxVolume}
        onVolumeChange={handleVolumeChange}
        onTestSfx={handleTestSfx}
        gameSpeedMultiplier={gameSpeedMultiplier}
        onGameSpeedChange={handleGameSpeedChange}
        screenShakeEnabled={screenShakeEnabled}
        onToggleScreenShake={(val) => setScreenShakeEnabled(val)}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={handleToggleHaptics}
        isHapticsSupported={haptics.isSupported()}
        onTestHaptics={handleTestHaptics}
        isMuted={isMuted}
        onToggleMute={toggleAudio}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
