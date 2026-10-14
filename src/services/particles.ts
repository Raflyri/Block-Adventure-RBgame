import { COLS } from '../constants/game';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity?: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation?: number;
  rotSpeed?: number;
  isDebris?: boolean;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  decay: number;
  lineWidth: number;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  resize(width: number, height: number) {
    if (!this.canvas || !this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  updateAndDraw() {
    if (!this.ctx || !this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    // Shockwaves
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

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.15;
      p.rotation = (p.rotation || 0) + (p.rotSpeed || 0.05);
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > (this.canvas.height / dpr)) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation || 0);
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

  spawnBombExplosion(x: number, y: number) {
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

  spawnLineClearDebris(rowY: number, colorsInRow: (string | number)[], blockSize: number) {
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
          color: String(color),
          alpha: 1.0,
          decay: 0.025 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          isDebris: true
        });
      }
    }
  }

  spawnMegaRBlockBurst(width: number, height: number) {
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

export const particles = new ParticleSystem();
