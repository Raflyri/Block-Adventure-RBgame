import { COLS, ROWS, BASE_TETROMINOES, THEMES } from '../constants/game';
import { ActivePiece, ThemeId, SandGridState } from '../types/game';

// Offscreen buffer singleton untuk merender piksel pasir tanpa alokasi memori berulang
let sandOffscreenCanvas: HTMLCanvasElement | null = null;
let sandOffscreenCtx: CanvasRenderingContext2D | null = null;
let sandImageData: ImageData | null = null;
let sandUint32Buffer: Uint32Array | null = null;

function ensureSandBuffer(width: number, height: number) {
  if (
    !sandOffscreenCanvas ||
    sandOffscreenCanvas.width !== width ||
    sandOffscreenCanvas.height !== height
  ) {
    sandOffscreenCanvas = document.createElement('canvas');
    sandOffscreenCanvas.width = width;
    sandOffscreenCanvas.height = height;
    sandOffscreenCtx = sandOffscreenCanvas.getContext('2d');
    if (sandOffscreenCtx) {
      sandImageData = sandOffscreenCtx.createImageData(width, height);
      sandUint32Buffer = new Uint32Array(sandImageData.data.buffer);
    }
  }
}

/**
 * Konversi warna Hex (#RRGGBB) menjadi array [R, G, B]
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Merender seluruh butir pasir ke main canvas dengan kecepatan tinggi (ImageData).
 */
export function renderSandGrid(
  ctx: CanvasRenderingContext2D,
  sandGrid: SandGridState,
  canvasWidth: number,
  canvasHeight: number,
  colorIdToHex: Record<number, string>
): void {
  const { width, height, cells, shade } = sandGrid;
  ensureSandBuffer(width, height);

  if (!sandOffscreenCtx || !sandImageData || !sandUint32Buffer || !sandOffscreenCanvas) {
    return;
  }

  // Pre-compute RGB per colorId (1..8) untuk lookup instan di dalam loop
  const rgbLUT: [number, number, number][] = [[0, 0, 0]];
  for (let id = 1; id <= 8; id++) {
    rgbLUT[id] = hexToRgb(colorIdToHex[id] || '#ffffff');
  }

  const totalCells = width * height;
  for (let i = 0; i < totalCells; i++) {
    const colorId = cells[i];
    if (colorId === 0) {
      sandUint32Buffer[i] = 0x00000000; // Transparan penuh
      continue;
    }

    const [r, g, b] = rgbLUT[colorId] || [255, 255, 255];
    const s = shade[i] / 255; // Faktor kilau tekstur permen/pasir (0.7 - 1.0)

    const rr = (r * s) | 0;
    const gg = (g * s) | 0;
    const bb = (b * s) | 0;

    // Format Little-Endian ABGR untuk Uint32Array ImageData
    sandUint32Buffer[i] = (255 << 24) | (bb << 16) | (gg << 8) | rr;
  }

  sandOffscreenCtx.putImageData(sandImageData, 0, 0);

  // Gambar ke canvas utama dengan pixel-art crisp scaling
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sandOffscreenCanvas, 0, 0, canvasWidth, canvasHeight);
  ctx.restore();
}

export class CanvasRenderer {
  static renderSandGrid = renderSandGrid;
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
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

  static drawThemedBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    themeId: ThemeId
  ) {
    const style = THEMES[themeId]?.renderStyle || 'glossy';
    ctx.save();

    const pad = Math.max(1, size * 0.05);
    const bx = x + pad;
    const by = y + pad;
    const bs = size - pad * 2;

    if (style === 'neon') {
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(4, bs * 0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, bs * 0.12);

      this.drawRoundedRect(ctx, bx, by, bs, bs, Math.max(2, bs * 0.15));
      ctx.fillStyle = 'rgba(10, 8, 26, 0.7)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + bs / 2, by + bs / 2, Math.max(1, bs * 0.12), 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'pastel') {
      const radius = Math.max(4, bs * 0.3);
      this.drawRoundedRect(ctx, bx, by, bs, bs, radius);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(bx + bs * 0.75, by + bs * 0.25, Math.max(1.5, bs * 0.1), 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'retro') {
      ctx.fillStyle = '#0f380f';
      ctx.fillRect(bx, by, bs, bs);

      ctx.fillStyle = '#9bbc0f';
      ctx.fillRect(bx + 1, by + 1, bs - 2, 2);
      ctx.fillRect(bx + 1, by + 1, 2, bs - 2);

      ctx.fillStyle = '#306230';
      ctx.fillRect(bx + 1, by + bs - 3, bs - 2, 2);
      ctx.fillRect(bx + bs - 3, by + 1, 2, bs - 2);

      ctx.fillStyle = color;
      ctx.fillRect(bx + 3, by + 3, bs - 6, bs - 6);
    } else {
      // Default glossy candy
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
    }

    ctx.restore();
  }

  static draw1x1BombBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fuseSeconds: string | null = null
  ) {
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

  static drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    blockSize: number,
    themeId: ThemeId
  ) {
    ctx.save();
    const style = THEMES[themeId]?.renderStyle || 'glossy';
    ctx.strokeStyle =
      style === 'neon'
        ? 'rgba(0, 229, 255, 0.08)'
        : style === 'retro'
        ? 'rgba(139, 172, 15, 0.1)'
        : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * blockSize, 0);
      ctx.lineTo(c * blockSize, height);
      ctx.stroke();
    }

    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * blockSize);
      ctx.lineTo(width, r * blockSize);
      ctx.stroke();
    }
    ctx.restore();
  }

  static drawBoard(
    ctx: CanvasRenderingContext2D,
    board: (string | number)[][],
    blockSize: number,
    themeId: ThemeId
  ) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board[r][c];
        if (color !== 0) {
          this.drawThemedBlock(ctx, c * blockSize, r * blockSize, blockSize, String(color), themeId);
        }
      }
    }
  }

  static drawPiece(
    ctx: CanvasRenderingContext2D,
    piece: ActivePiece,
    blockSize: number,
    themeId: ThemeId,
    fuseRemaining: number | null
  ) {
    const { matrix, x, y, color, isBomb } = piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          if (isBomb) {
            const fuseSec = fuseRemaining !== null ? (fuseRemaining / 1000).toFixed(1) : null;
            this.draw1x1BombBlock(ctx, (x + c) * blockSize, (y + r) * blockSize, blockSize, fuseSec);
          } else {
            this.drawThemedBlock(ctx, (x + c) * blockSize, (y + r) * blockSize, blockSize, color, themeId);
          }
        }
      }
    }
  }

  static drawGhostPiece(
    ctx: CanvasRenderingContext2D,
    ghost: { x: number; y: number; matrix: number[][]; color: string; isBomb: boolean },
    blockSize: number
  ) {
    const { matrix, x, y, color, isBomb } = ghost;
    ctx.save();
    ctx.strokeStyle = isBomb ? '#ff2a2a' : color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = isBomb ? 'rgba(255, 42, 42, 0.15)' : 'rgba(255, 255, 255, 0.06)';

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const px = (x + c) * blockSize + 1.5;
          const py = (y + r) * blockSize + 1.5;
          const s = blockSize - 3;
          this.drawRoundedRect(ctx, px, py, s, s, Math.max(3, s * 0.22));
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  static renderMiniPreview(
    ctx: CanvasRenderingContext2D,
    piece: ActivePiece | null,
    w: number,
    h: number,
    themeId: ThemeId,
    fallbackEmoji: string = '👀'
  ) {
    ctx.clearRect(0, 0, w, h);
    if (!piece) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = `${Math.floor(w * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fallbackEmoji, w / 2, h / 2);
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
            this.drawThemedBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, piece.color, themeId);
          }
        }
      }
    }
  }

  static renderHoldPiece(
    ctx: CanvasRenderingContext2D,
    pieceType: string | null,
    w: number,
    h: number,
    themeId: ThemeId
  ) {
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

    const def = BASE_TETROMINOES[pieceType];
    if (!def) return;
    const matrix = def.shape;
    const cols = matrix[0].length;
    const rows = matrix.length;
    const cellSize = Math.min(Math.floor((w * 0.75) / cols), Math.floor((h * 0.75) / rows), 22);

    const offsetX = Math.floor((w - cols * cellSize) / 2);
    const offsetY = Math.floor((h - rows * cellSize) / 2);

    const themeColor = THEMES[themeId]?.colors[pieceType] || def.color;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] !== 0) {
          if (def.isBomb) {
            this.draw1x1BombBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize);
          } else {
            this.drawThemedBlock(ctx, offsetX + c * cellSize, offsetY + r * cellSize, cellSize, themeColor, themeId);
          }
        }
      }
    }
  }
}
