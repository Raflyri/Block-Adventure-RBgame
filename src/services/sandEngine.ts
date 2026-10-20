// src/services/sandEngine.ts
import { SandGridState, ClearedSandCluster, TetrominoType } from '../types/game';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants/game';

export const SAND_SCALE = 6; // 1 blok Tetris = 6x6 = 36 butir pasir
export const SAND_WIDTH = BOARD_WIDTH * SAND_SCALE;   // 60
export const SAND_HEIGHT = BOARD_HEIGHT * SAND_SCALE; // 120

// Pemetaan Tipe Tetromino ke ID Warna Numerik (1 - 8)
export const TYPE_TO_COLOR_ID: Record<TetrominoType, number> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7,
  BOMB: 8,
};

export function createSandGrid(): SandGridState {
  const size = SAND_WIDTH * SAND_HEIGHT;
  return {
    width: SAND_WIDTH,
    height: SAND_HEIGHT,
    scale: SAND_SCALE,
    cells: new Uint8Array(size),
    shade: new Uint8Array(size),
    updated: new Uint8Array(size),
  };
}

export function clearSandGrid(grid: SandGridState): void {
  grid.cells.fill(0);
  grid.shade.fill(0);
  grid.updated.fill(0);
}

/**
 * Mengecek apakah posisi Tetromino (dalam koordinat standar 10x20)
 * bertabrakan dengan dinding, lantai, atau tumpukan pasir yang sudah ada.
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

      // Cek batas luar dinding & lantai
      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
        return true;
      }

      // Abaikan sel yang masih berada di atas papan (boardY < 0)
      if (boardY < 0) continue;

      // Cek apakah ada butir pasir di dalam sub-grid NxN milik blok ini
      const startX = boardX * scale;
      const startY = boardY * scale;

      // Gunakan threshold (> 2 butir) agar gesekan tepi sedikit tidak langsung memblokir gerakan
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
 * Mengubah Tetromino yang mengunci (lock down) menjadi butiran pasir.
 */
export function imprintPieceToSand(
  grid: SandGridState,
  shape: number[][],
  pieceX: number,
  pieceY: number,
  type: TetrominoType | string
): boolean {
  const { width, height, scale, cells, shade } = grid;
  const colorId = TYPE_TO_COLOR_ID[type as TetrominoType] || 1;
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
          // Variasi tekstur pasir (nilai 180..255 untuk variasi terang/gelap)
          const isBorder = sx === 0 || sy === 0 || sx === scale - 1 || sy === scale - 1;
          shade[idx] = isBorder
            ? 210 + Math.floor(Math.random() * 25)
            : 225 + Math.floor(Math.random() * 30);
        }
      }
    }
  }

  return toppedOut;
}

/**
 * Menghancurkan pasir dalam radius lingkaran ketika blok BOMB mendarat.
 */
export function detonateSandBomb(
  grid: SandGridState,
  centerX: number, // koordinat board (0..10)
  centerY: number, // koordinat board (0..20)
  radiusBlocks: number = 2.0
): number {
  const { width, height, scale, cells, shade } = grid;
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
          destroyedCount++;
        }
      }
    }
  }

  return destroyedCount;
}

/**
 * Menjalankan 1 langkah (step) simulasi Cellular Automata untuk pasir jatuh.
 * Mengembalikan `true` jika masih ada butiran pasir yang bergerak.
 */
export function stepSandPhysics(grid: SandGridState, tickParity: number): boolean {
  const { width, height, cells, shade, updated } = grid;
  updated.fill(0);
  let moved = false;

  // Iterasi dari baris kedua paling bawah ke atas
  for (let y = height - 2; y >= 0; y--) {
    // Bergantian scan kiri-ke-kanan dan kanan-ke-kiri agar gundukan simetris
    const leftToRight = ((y + tickParity) & 1) === 0;

    for (let i = 0; i < width; i++) {
      const x = leftToRight ? i : width - 1 - i;
      const idx = y * width + x;
      const color = cells[idx];

      if (color === 0 || updated[idx]) continue;

      const belowIdx = (y + 1) * width + x;

      // 1. Cek tepat di bawah (x, y + 1)
      if (cells[belowIdx] === 0) {
        cells[belowIdx] = color;
        shade[belowIdx] = shade[idx];
        updated[belowIdx] = 1;
        cells[idx] = 0;
        shade[idx] = 0;
        moved = true;
        continue;
      }

      // 2. Cek diagonal bawah kiri & kanan dengan urutan acak/bergantian
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
 * Mencari dan menghapus kelompok pasir berwarna sama yang menyambung
 * tanpa putus dari dinding kiri (x = 0) sampai dinding kanan (x = width - 1).
 */
export function findAndClearSandBridges(
  grid: SandGridState,
  paletteMap: Record<number, string>
): ClearedSandCluster[] {
  const { width, height, scale, cells, shade } = grid;
  const visited = new Uint8Array(width * height);
  const clearedClusters: ClearedSandCluster[] = [];

  // Pre-allocated queue untuk BFS cepat
  const queue = new Int32Array(width * height);

  for (let startY = 0; startY < height; startY++) {
    const startIdx = startY * width; // x = 0 (Dinding Kiri)
    const targetColor = cells[startIdx];

    if (targetColor === 0 || visited[startIdx]) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = startIdx;
    visited[startIdx] = 1;

    let touchesRightWall = false;
    const componentIndices: number[] = [];
    let sumX = 0;
    let sumY = 0;

    while (head < tail) {
      const currIdx = queue[head++];
      componentIndices.push(currIdx);

      const cx = currIdx % width;
      const cy = (currIdx / width) | 0;

      sumX += cx;
      sumY += cy;

      if (cx === width - 1) {
        touchesRightWall = true;
      }

      // 8-directional connectivity (termasuk diagonal rapat) agar aliran pasir wajar tersambung
      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy;
        if (ny < 0 || ny >= height) continue;
        const rowOffset = ny * width;

        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= width) continue;

          const nIdx = rowOffset + nx;
          if (!visited[nIdx] && cells[nIdx] === targetColor) {
            visited[nIdx] = 1;
            queue[tail++] = nIdx;
          }
        }
      }
    }

    if (touchesRightWall && componentIndices.length > 0) {
      // Hapus seluruh butir pasir dalam jembatan ini
      for (let i = 0; i < componentIndices.length; i++) {
        const idx = componentIndices[i];
        cells[idx] = 0;
        shade[idx] = 0;
      }

      const avgX = sumX / componentIndices.length / scale;
      const avgY = sumY / componentIndices.length / scale;

      clearedClusters.push({
        colorId: targetColor,
        colorHex: paletteMap[targetColor] || '#ffffff',
        indices: componentIndices,
        centroidX: avgX,
        centroidY: avgY,
      });
    }
  }

  return clearedClusters;
}

/**
 * Mengecek apakah tumpukan pasir sudah mencapai batas bahaya di atas (Game Over).
 */
export function isSandToppedOut(grid: SandGridState): boolean {
  const { width, scale, cells } = grid;
  // Cek 2 sub-baris teratas
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
