// src/services/sandEngine.ts
import { SandGridState, ClearedSandCluster, TetrominoType, ThemeId } from '../types/game';
import { BOARD_WIDTH, BOARD_HEIGHT, THEMES } from '../constants/game';

export const SAND_SCALE = 6; // 1 blok Tetris = 6x6 = 36 butir pasir
export const SAND_WIDTH = BOARD_WIDTH * SAND_SCALE;   // 60
export const SAND_HEIGHT = BOARD_HEIGHT * SAND_SCALE; // 120

export const STONE_COLOR_ID = 9;

// Pemetaan Tipe Tetromino ke ID Warna Numerik (1 - 9)
export const TYPE_TO_COLOR_ID: Record<TetrominoType, number> = {
  I: 1, // Cyan
  J: 2, // Blue
  L: 3, // Orange
  O: 4, // Yellow
  S: 5, // Green
  T: 6, // Purple
  Z: 7, // Red
  BOMB: 8,
  STONE: 9,
};

export const COLOR_ID_TO_TYPE: Record<number, TetrominoType> = {
  1: 'I',
  2: 'J',
  3: 'L',
  4: 'O',
  5: 'S',
  6: 'T',
  7: 'Z',
  8: 'BOMB',
  9: 'STONE',
};

export function getThemeColorIdMap(themeId: ThemeId): Record<number, string> {
  const theme = THEMES[themeId] || THEMES.candy;
  const c = theme.colors;
  return {
    1: c.I || '#00e5ff',
    2: c.J || '#4361ee',
    3: c.L || '#ff7b00',
    4: c.O || '#ffbe0b',
    5: c.S || '#06d6a0',
    6: c.T || '#a370f7',
    7: c.Z || '#ff4d6d',
    8: c.BOMB || '#ff2a2a',
    9: c.STONE || '#64748b'
  };
}

export interface SandLevelPalette {
  levelTier: string;
  allowedColorIds: number[];
  allowedTypes: TetrominoType[];
}

/**
 * 1. Aggressive Color Scaling (Phase 1 Balancing):
 * - Level 1–2: 4 warna (Red, Blue, Yellow, Cyan)
 * - Level 3–4: 5 warna (+ Green)
 * - Level 5+: Full 7 warna (+ Purple, + Orange)
 */
export function getSandLevelPalette(level: number): SandLevelPalette {
  if (level <= 2) {
    return {
      levelTier: 'Starter',
      allowedColorIds: [7, 2, 4, 1], // Red, Blue, Yellow, Cyan (4 warna)
      allowedTypes: ['Z', 'J', 'O', 'I']
    };
  } else if (level <= 4) {
    return {
      levelTier: 'Medium',
      allowedColorIds: [7, 2, 4, 1, 5], // + Green (5 warna)
      allowedTypes: ['Z', 'J', 'O', 'I', 'S']
    };
  } else {
    return {
      levelTier: 'Master',
      allowedColorIds: [7, 2, 4, 1, 5, 6, 3], // Full 7 colors
      allowedTypes: ['Z', 'J', 'O', 'I', 'S', 'T', 'L']
    };
  }
}

/**
 * Dynamic Cluster Area Threshold (Mega Blob nerf):
 * Level 1: 220 grains
 * Level 2: 280 grains
 * Level 3: 350 grains
 * Level 4: 420 grains
 * Level 5: 500 grains
 * Level 6+: Capped at 700 grains
 */
export function getClusterClearThreshold(level: number): number {
  if (level <= 1) return 220;
  if (level === 2) return 280;
  if (level === 3) return 350;
  if (level === 4) return 420;
  if (level === 5) return 500;
  return Math.min(700, 500 + (level - 5) * 60);
}

/**
 * Backward-compatible helper untuk mendapatkan daftar tipe balok sesuai level
 */
export function getSandPiecePool(level: number): TetrominoType[] {
  return getSandLevelPalette(level).allowedTypes;
}

/**
 * Smart Color Weighting / Bag Bias (Heuristic):
 * Mengecek apakah suatu warna mendominasi >= 35% permukaan atas pasir.
 * Mengembalikan ID warna tersebut agar spawn berikutnya dapat diprioritaskan.
 */
export function getDominantSurfaceColor(
  grid: SandGridState,
  level: number
): number | null {
  const { width, height, cells } = grid;
  const counts: Record<number, number> = {};
  let surfaceCount = 0;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const color = cells[y * width + x];
      if (color !== 0 && color !== 8 && color !== 9) {
        counts[color] = (counts[color] || 0) + 1;
        surfaceCount++;
        break; // Dapatkan butir pasir paling atas di kolom x
      }
    }
  }

  if (surfaceCount < 8) return null;

  let maxColorId = 0;
  let maxCount = 0;
  for (const [idStr, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxColorId = parseInt(idStr, 10);
    }
  }

  const ratio = maxCount / surfaceCount;
  const allowed = getSandLevelPalette(level).allowedColorIds;
  if (ratio >= 0.35 && allowed.includes(maxColorId)) {
    return maxColorId;
  }

  return null;
}

export function createSandGrid(): SandGridState {
  const size = SAND_WIDTH * SAND_HEIGHT;
  return {
    width: SAND_WIDTH,
    height: SAND_HEIGHT,
    scale: SAND_SCALE,
    cells: new Uint8Array(size),
    shade: new Uint8Array(size),
    updated: new Uint8Array(size),
    connectedToLeft: new Uint8Array(size),
    nearClearMask: new Uint8Array(size),
  };
}

export function clearSandGrid(grid: SandGridState): void {
  grid.cells.fill(0);
  grid.shade.fill(0);
  grid.updated.fill(0);
  if (grid.connectedToLeft) grid.connectedToLeft.fill(0);
  if (grid.nearClearMask) grid.nearClearMask.fill(0);
}

/**
 * Mengecek dan menandai butir-butir pasir yang terhubung ke dinding kiri (x = 0)
 * serta menandai kluster yang mendekati ambang clear (near-clear glow hint).
 */
export function updateSandVisualHints(grid: SandGridState, level: number = 1): void {
  const { width, height, cells, connectedToLeft, nearClearMask } = grid;
  if (!connectedToLeft || !nearClearMask) return;

  connectedToLeft.fill(0);
  nearClearMask.fill(0);

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const massiveNearThreshold = Math.floor(getClusterClearThreshold(level) * 0.72);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const startIdx = rowOffset + x;
      const color = cells[startIdx];
      // Exclude empty, bomb (8), and stone / dead sand (9)
      if (color === 0 || color === 8 || color === 9 || visited[startIdx]) continue;

      let head = 0;
      let tail = 0;
      queue[tail++] = startIdx;
      visited[startIdx] = 1;

      const comp: number[] = [];
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      while (head < tail) {
        const currIdx = queue[head++];
        comp.push(currIdx);

        const cx = currIdx % width;
        const cy = (currIdx / width) | 0;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= height) continue;
          const nRow = ny * width;

          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            if (nx < 0 || nx >= width) continue;

            const nIdx = nRow + nx;
            if (!visited[nIdx] && cells[nIdx] === color) {
              visited[nIdx] = 1;
              queue[tail++] = nIdx;
            }
          }
        }
      }

      // Cek apakah menyentuh dinding kiri
      const touchesLeft = minX === 0;
      if (touchesLeft) {
        for (let i = 0; i < comp.length; i++) {
          connectedToLeft[comp[i]] = 1;
        }
      }

      // Cek apakah kluster mendekati kondisi clear (Near-Clear Hint)
      const widthSpan = maxX - minX + 1;
      const heightSpan = maxY - minY + 1;
      const touchesFloor = maxY >= height - 2;

      const isNearHorizontal = widthSpan >= 45; // mendekati 54/60
      const isNearMassive = comp.length >= massiveNearThreshold;
      const isNearVertical = touchesFloor && heightSpan >= 32;

      if (isNearHorizontal || isNearMassive || isNearVertical) {
        for (let i = 0; i < comp.length; i++) {
          nearClearMask[comp[i]] = 1;
        }
      }
    }
  }
}

/**
 * Mengecek apakah posisi Tetromino bertabrakan dengan batas atau pasir.
 */
export function checkSandCollision(
  grid: SandGridState,
  shape: number[][],
  pieceX: number,
  pieceY: number
): boolean {
  const { width, height, scale, cells } = grid;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;

      const boardX = pieceX + c;
      const boardY = pieceY + r;

      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
        return true;
      }

      if (boardY < 0) continue;

      const startX = boardX * scale;
      const startY = boardY * scale;

      let occupiedGrains = 0;
      for (let sy = 0; sy < scale; sy++) {
        const y = startY + sy;
        if (y < 0 || y >= height) continue;
        const rowOffset = y * width;
        for (let sx = 0; sx < scale; sx++) {
          const x = startX + sx;
          if (x >= 0 && x < width && cells[rowOffset + x] !== 0) {
            occupiedGrains++;
            if (occupiedGrains > 2) return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Mengubah Tetromino yang mengunci menjadi butir pasir.
 * Mendukung sandColorId eksplisit agar bentuk Tetris apa pun bisa memakai warna level aktif.
 */
export function imprintPieceToSand(
  grid: SandGridState,
  shape: number[][],
  pieceX: number,
  pieceY: number,
  type: TetrominoType | string,
  sandColorId?: number
): boolean {
  const { width, height, scale, cells, shade } = grid;
  const colorId = sandColorId || TYPE_TO_COLOR_ID[type as TetrominoType] || 1;
  let toppedOut = false;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;

      const boardX = pieceX + c;
      const boardY = pieceY + r;

      if (boardY < 0) {
        toppedOut = true;
        continue;
      }

      const startX = boardX * scale;
      const startY = boardY * scale;

      for (let sy = 0; sy < scale; sy++) {
        const y = startY + sy;
        if (y < 0 || y >= height) continue;
        const rowOffset = y * width;

        for (let sx = 0; sx < scale; sx++) {
          const x = startX + sx;
          if (x < 0 || x >= width) continue;
          const idx = rowOffset + x;

          cells[idx] = colorId;
          const isBorder = sx === 0 || sy === 0 || sx === scale - 1 || sy === scale - 1;
          shade[idx] = isBorder
            ? 210 + Math.floor(Math.random() * 25)
            : 225 + Math.floor(Math.random() * 30);
        }
      }
    }
  }

  updateSandVisualHints(grid);
  return toppedOut;
}

/**
 * Menghancurkan pasir dalam radius lingkaran ketika blok BOMB mendarat.
 */
export function detonateSandBomb(
  grid: SandGridState,
  centerX: number,
  centerY: number,
  radiusBlocks: number = 2.2
): number {
  const { width, height, scale, cells, shade, connectedToLeft, nearClearMask } = grid;
  const cx = Math.floor((centerX + 0.5) * scale);
  const cy = Math.floor((centerY + 0.5) * scale);
  const rPx = Math.floor(radiusBlocks * scale);
  const rSq = rPx * rPx;

  let destroyedCount = 0;

  for (let y = Math.max(0, cy - rPx); y <= Math.min(height - 1, cy + rPx); y++) {
    for (let x = Math.max(0, cx - rPx); x <= Math.min(width - 1, cx + rPx); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rSq) {
        const idx = y * width + x;
        if (cells[idx] !== 0) {
          cells[idx] = 0;
          shade[idx] = 0;
          if (connectedToLeft) connectedToLeft[idx] = 0;
          if (nearClearMask) nearClearMask[idx] = 0;
          destroyedCount++;
        }
      }
    }
  }

  updateSandVisualHints(grid);
  return destroyedCount;
}

/**
 * 1 langkah simulasi Cellular Automata gravitasi pasir.
 */
export function stepSandPhysics(grid: SandGridState, tickParity: number): boolean {
  const { width, height, cells, shade, updated } = grid;
  updated.fill(0);
  let moved = false;

  for (let y = height - 2; y >= 0; y--) {
    const leftToRight = ((y + tickParity) & 1) === 0;

    for (let i = 0; i < width; i++) {
      const x = leftToRight ? i : width - 1 - i;
      const idx = y * width + x;
      const color = cells[idx];

      if (color === 0 || updated[idx]) continue;

      const belowIdx = (y + 1) * width + x;

      if (cells[belowIdx] === 0) {
        cells[belowIdx] = color;
        shade[belowIdx] = shade[idx];
        updated[belowIdx] = 1;
        cells[idx] = 0;
        shade[idx] = 0;
        moved = true;
        continue;
      }

      const preferLeft = ((x + y + tickParity) & 1) === 0;
      const dx1 = preferLeft ? -1 : 1;
      const dx2 = preferLeft ? 1 : -1;

      const x1 = x + dx1;
      if (x1 >= 0 && x1 < width) {
        const diag1Idx = (y + 1) * width + x1;
        if (cells[diag1Idx] === 0) {
          cells[diag1Idx] = color;
          shade[diag1Idx] = shade[idx];
          updated[diag1Idx] = 1;
          cells[idx] = 0;
          shade[idx] = 0;
          moved = true;
          continue;
        }
      }

      const x2 = x + dx2;
      if (x2 >= 0 && x2 < width) {
        const diag2Idx = (y + 1) * width + x2;
        if (cells[diag2Idx] === 0) {
          cells[diag2Idx] = color;
          shade[diag2Idx] = shade[idx];
          updated[diag2Idx] = 1;
          cells[idx] = 0;
          shade[idx] = 0;
          moved = true;
          continue;
        }
      }
    }
  }

  return moved;
}

/**
 * 2. Multi-Condition Clearing Engine (Strict Balancing & Obstacle Destruction)
 * Kondisi Clear:
 *   1. Strict Horizontal Span:
 *      - Full Span (x=0 ke x >= width-2) DENGAN ketebalan rata-rata >= 2.6px dan >= 160 grains
 *      - ATAU Wide Span (lebar kluster >= 90% lebar papan) DENGAN ketebalan >= 2.8px dan >= 150 grains
 *   2. Strict Vertical Connection:
 *      - Menyentuh lantai dan membentang tinggi (tinggi >= 45px dan >= 140 grains dan puncak <= 35% papan)
 *   3. Dynamic Cluster / Mass Clear:
 *      - Jumlah butir terhubung >= getClusterClearThreshold(level) (Lv 1: 220, Lv 3: 350, Lv 5: 500, dst.)
 *
 * Efek Ke Dead Sand (Stone):
 *   - Butir pasir Stone (ID 9) TIDAK BISA memicu clear sendiri.
 *   - Ketika kluster warna normal meledak/clear, semua butir Stone yang bersentuhan langsung (8 arah) ikut hancur!
 */
export function findAndClearSandBridges(
  grid: SandGridState,
  paletteMap: Record<number, string>,
  level: number = 1
): ClearedSandCluster[] {
  const { width, height, scale, cells, shade, connectedToLeft, nearClearMask } = grid;
  const visited = new Uint8Array(width * height);
  const clearedClusters: ClearedSandCluster[] = [];

  const queue = new Int32Array(width * height);
  const widthThreshold90 = Math.ceil(width * 0.90); // 54 kolom
  const clusterThreshold = getClusterClearThreshold(level);

  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const startIdx = rowOffset + x;
      const targetColor = cells[startIdx];

      // Exclude kosong (0), BOMB (8), dan STONE (9)
      if (targetColor === 0 || targetColor === 8 || targetColor === 9 || visited[startIdx]) continue;

      let head = 0;
      let tail = 0;
      queue[tail++] = startIdx;
      visited[startIdx] = 1;

      const componentIndices: number[] = [];
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;

      while (head < tail) {
        const currIdx = queue[head++];
        componentIndices.push(currIdx);

        const cx = currIdx % width;
        const cy = (currIdx / width) | 0;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        sumX += cx;
        sumY += cy;

        // 8-directional connectivity (horizontal, vertical, diagonal)
        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= height) continue;
          const nRowOffset = ny * width;

          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            if (nx < 0 || nx >= width) continue;

            const nIdx = nRowOffset + nx;
            if (!visited[nIdx] && cells[nIdx] === targetColor) {
              visited[nIdx] = 1;
              queue[tail++] = nIdx;
            }
          }
        }
      }

      const widthSpan = maxX - minX + 1;
      const heightSpan = maxY - minY + 1;
      const grainCount = componentIndices.length;
      const touchesFloor = maxY >= height - 2;
      const avgThickness = grainCount / widthSpan;

      // 1. Strict Horizontal Span (membutuhkan ketebalan nyata)
      const isFullSpan = minX === 0 && maxX >= width - 2 && avgThickness >= 2.6 && grainCount >= 160;
      const isWideSpan = widthSpan >= widthThreshold90 && avgThickness >= 2.8 && grainCount >= 150;

      // 2. Strict Vertical Connection Clear
      const isVerticalSpan = touchesFloor && heightSpan >= 45 && grainCount >= 140 && (minY <= Math.floor(height * 0.35));

      // 3. Dynamic Cluster / Mass Clear (skala berdasarkan level)
      const isMassiveCluster = grainCount >= clusterThreshold;

      if (isFullSpan || isWideSpan || isVerticalSpan || isMassiveCluster) {
        // Cari semua butir Stone (Dead Sand) yang bersentuhan langsung dengan kluster ini
        const adjacentStoneIndices: number[] = [];
        const stoneVisitedInWave = new Uint8Array(width * height);

        for (let i = 0; i < componentIndices.length; i++) {
          const idx = componentIndices[i];
          const cx = idx % width;
          const cy = (idx / width) | 0;

          for (let dy = -1; dy <= 1; dy++) {
            const ny = cy + dy;
            if (ny < 0 || ny >= height) continue;
            const nRow = ny * width;

            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              if (nx < 0 || nx >= width) continue;

              const nIdx = nRow + nx;
              if (cells[nIdx] === 9 && !stoneVisitedInWave[nIdx]) {
                stoneVisitedInWave[nIdx] = 1;
                adjacentStoneIndices.push(nIdx);
              }
            }
          }
        }

        // Hancurkan butir kluster warna
        for (let i = 0; i < componentIndices.length; i++) {
          const idx = componentIndices[i];
          cells[idx] = 0;
          shade[idx] = 0;
          if (connectedToLeft) connectedToLeft[idx] = 0;
          if (nearClearMask) nearClearMask[idx] = 0;
        }

        // Hancurkan butir Stone yang bertetangga
        for (let i = 0; i < adjacentStoneIndices.length; i++) {
          const sIdx = adjacentStoneIndices[i];
          cells[sIdx] = 0;
          shade[sIdx] = 0;
          if (connectedToLeft) connectedToLeft[sIdx] = 0;
          if (nearClearMask) nearClearMask[sIdx] = 0;
        }

        const avgX = sumX / grainCount / scale;
        const avgY = sumY / grainCount / scale;

        const clearType: 'full_span' | 'wide_span' | 'vertical_span' | 'massive_cluster' = isFullSpan
          ? 'full_span'
          : isWideSpan
          ? 'wide_span'
          : isVerticalSpan
          ? 'vertical_span'
          : 'massive_cluster';

        clearedClusters.push({
          colorId: targetColor,
          colorHex: paletteMap[targetColor] || '#ffffff',
          indices: componentIndices,
          centroidX: avgX,
          centroidY: avgY,
          clearType,
          grainsCount: grainCount,
          widthSpan,
          heightSpan,
          stoneIndices: adjacentStoneIndices,
          clearedStoneGrainsCount: adjacentStoneIndices.length,
        });
      }
    }
  }

  updateSandVisualHints(grid, level);
  return clearedClusters;
}

export function getSandHighestY(grid: SandGridState): number {
  const { width, height, cells } = grid;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      if (cells[rowOffset + x] !== 0) {
        return y;
      }
    }
  }
  return height;
}

export function isSandToppedOut(grid: SandGridState): boolean {
  const { width, scale, cells } = grid;
  for (let y = 0; y < Math.min(2, scale); y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      if (cells[rowOffset + x] !== 0) {
        return true;
      }
    }
  }
  return false;
}
