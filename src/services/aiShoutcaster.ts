import { SandGridState } from '../types/game';
import { ROWS, COLS } from '../constants/game';

export type ShoutcasterEventType =
  | 'game_start'
  | 'sand_clear'
  | 'combo'
  | 'critical_stack'
  | 'bomb_blast'
  | 'victory'
  | 'game_over';

export type ShoutcasterMood = 'idle' | 'excited' | 'combo' | 'panic' | 'celebrate';

export interface ShoutcasterEventPayload {
  type: ShoutcasterEventType;
  mode: 'classic' | 'sand' | 'daily' | 'puzzle';
  score: number;
  level: number;
  linesCleared?: number;
  comboStreak?: number;
  sandBridges?: number;
  sandGrains?: number;
  stoneBroken?: number;
  stackHeightRatio?: number; // 0.0 (kosong) s.d. 1.0 (penuh mencapai atas)
}

export interface ShoutcasterMessage {
  id: number;
  text: string;
  mood: ShoutcasterMood;
  eventType: ShoutcasterEventType;
  source: 'gemini' | 'local_ai';
  timestamp: number;
}

export const SHOUTCASTER_SYSTEM_PROMPT =
  'Kamu adalah komentator game e-sports yang ceria, kocak, dan menyemangati. Berikan komentar 1 kalimat singkat dalam bahasa Indonesia berdasarkan status papan game saat ini.';

const FALLBACK_COMMENTARY: Record<ShoutcasterEventType, string[]> = {
  game_start: [
    'Gas pol! Arena RBlock sudah panas, tunjukkan skill dewa kamu! 🔥',
    'Siap-siap! Jangan kasih kendor, susun baloknya sampai pecah rekor! 🚀',
    'Pertandingan dimulai! Fokus, santai, dan raih kombo maksimal! ⚡'
  ],
  sand_clear: [
    'GOKIL! Jembatan pasir tersambung mulus dari kiri ke kanan, meleleh indah banget! ⏳✨',
    'Wuidih! Aliran pasir warna-warninya nyambung sempurna, auto panen poin! 🌈🏖️',
    'IQ 200! Pasirnya lumer menyatu lintas arena, mainnya rapi banget bos! 🔥⏳',
    'Sapu bersih pasirnya! Koneksi warna yang bikin lawan ketar-ketir! 💥'
  ],
  combo: [
    'AMPUN DJ! Kombo beruntun tanpa ampun, jari kamu secepat kilat! ⚡🔥',
    'GGWP! Kombo meledak-ledak, penonton di tribun langsung berdiri semua! 🎉🚀',
    'Bukan kaleng-kaleng! Rentetan kombo manis yang bikin skor meroket! 🌟💥',
    'Gila sih ini! Kombo beruntunnya nggak ada obat, teruskan ritmenya! 🔥👑'
  ],
  critical_stack: [
    'WADUH GAWAT! Tumpukan sudah hampir nyundul atap, ayo tenang dan cari celah! 🚨😱',
    'Jantung berdebar kencang! Papan makin sesak, saatnya clutch play penyelamat! ⚠️🔥',
    'AWAS MENTOK! Tinggal sejengkal lagi dari puncak, fokus tingkat dewa aktif! 😰⚡',
    'Situasi darurat di arena! Satu gerakan tepat atau Candy Bomb bisa balikkan keadaan! 💣🆘'
  ],
  bomb_blast: [
    'DUAAAR! Candy Bomb meledak dahsyat, tumpukan langsung rata seketika! 💣💥',
    'BOOM SHAKALAKA! Ledakan manis 3x3 yang menyelamatkan arena! 🔥🍬',
    'Ledakan taktis tingkat tinggi! Balok pengganggu langsung mental semua! 💥🚀'
  ],
  victory: [
    'JUARA DUNIA! Permainan kelas kakap yang layak masuk Hall of Fame! 🏆👑',
    'VICTORY MANIS! Strategi kamu bener-bener tanpa celah hari ini! 🎉🌟'
  ],
  game_over: [
    'Nice try, Champion! Tadi sudah keren banget, yuk balas dendam di ronde berikutnya! 💪✨',
    'Pertarungan yang sengit! Sedikit lagi pecah rekor, gas main lagi! 🔥🎮'
  ]
};

/**
 * Menghitung rasio ketinggian tumpukan papan Classic/Daily/Puzzle (0.0 - 1.0)
 */
export function getClassicBoardStackRatio(board: (string | number)[][]): number {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== 0) {
        const occupiedRows = ROWS - r;
        return Math.min(1, Math.max(0, occupiedRows / ROWS));
      }
    }
  }
  return 0;
}

/**
 * Menghitung rasio ketinggian tumpukan pasir pada mode Sand Physics (0.0 - 1.0)
 */
export function getSandGridStackRatio(sandGrid: SandGridState): number {
  const { width, height, cells } = sandGrid;
  for (let y = 0; y < height; y += 2) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 2) {
      if (cells[rowOffset + x] > 0) {
        const occupiedHeight = height - y;
        return Math.min(1, Math.max(0, occupiedHeight / height));
      }
    }
  }
  return 0;
}

type Listener = (msg: ShoutcasterMessage) => void;

class AIShoutcasterService {
  private listeners: Set<Listener> = new Set();
  private lastCallTimestamp: number = 0;
  private lastCriticalAlertTimestamp: number = 0;
  private messageCounter: number = 0;
  private isFetching: boolean = false;
  public enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('rblock_ai_shoutcaster');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('rblock_ai_shoutcaster', val ? 'true' : 'false');
    } catch {}
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(msg: ShoutcasterMessage) {
    this.listeners.forEach((fn) => fn(msg));
  }

  private resolveMood(type: ShoutcasterEventType): ShoutcasterMood {
    switch (type) {
      case 'combo':
        return 'combo';
      case 'sand_clear':
      case 'bomb_blast':
        return 'excited';
      case 'critical_stack':
        return 'panic';
      case 'victory':
        return 'celebrate';
      default:
        return 'excited';
    }
  }

  private buildDynamicPrompt(payload: ShoutcasterEventPayload): string {
    const {
      type,
      mode,
      score,
      level,
      linesCleared = 0,
      comboStreak = 0,
      sandBridges = 0,
      sandGrains = 0,
      stoneBroken = 0,
      stackHeightRatio = 0
    } = payload;

    const stackPercent = Math.round(stackHeightRatio * 100);
    const modeName =
      mode === 'sand' ? 'Sand Physics' : mode === 'daily' ? 'Daily Challenge' : mode === 'puzzle' ? 'Puzzle Stage' : 'Classic Block';

    switch (type) {
      case 'sand_clear':
        return `Mode: ${modeName}. Pemain baru saja menyambungkan ${sandBridges} jembatan pasir (${sandGrains} butir pasir meleleh${stoneBroken > 0 ? ` dan menghancurkan ${stoneBroken} batu penghalang` : ''})! Skor: ${score}, Level: ${level}.`;
      case 'combo':
        return `Mode: ${modeName}. Pemain mencetak ${comboStreak}x COMBO beruntun dan menghancurkan ${linesCleared} baris sekaligus! Skor: ${score}, Level: ${level}.`;
      case 'critical_stack':
        return `Mode: ${modeName}. KONDISI KRITIS! Tumpukan balok/pasir sudah mencapai ${stackPercent}% tinggi papan (hampir penuh menyentuh batas atas). Skor saat ini: ${score}, Level: ${level}.`;
      case 'bomb_blast':
        return `Mode: ${modeName}. Pemain meledakkan Candy Bomb 3x3 yang menghancurkan tumpukan di tengah situasi seru! Skor: ${score}, Level: ${level}.`;
      case 'victory':
        return `Mode: ${modeName}. Pemain MENANG menyelesaikan tantangan dengan skor ${score} di Level ${level}!`;
      case 'game_over':
        return `Mode: ${modeName}. Permainan berakhir (Game Over) dengan skor akhir ${score} di Level ${level}. Semangati untuk main lagi!`;
      case 'game_start':
      default:
        return `Mode: ${modeName} baru saja dimulai! Semangati pemain untuk mencetak rekor baru!`;
    }
  }

  private getFallbackComment(payload: ShoutcasterEventPayload): string {
    const pool = FALLBACK_COMMENTARY[payload.type] || FALLBACK_COMMENTARY.combo;
    const base = pool[Math.floor(Math.random() * pool.length)];

    if (payload.type === 'combo' && (payload.comboStreak || 0) >= 2) {
      return `${payload.comboStreak}x COMBO! ${base}`;
    }
    if (payload.type === 'sand_clear' && (payload.sandBridges || 0) >= 2) {
      return `${payload.sandBridges}x SAND BRIDGE! ${base}`;
    }
    return base;
  }

  private getClientApiKey(): string | null {
    try {
      const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (envKey && typeof envKey === 'string' && envKey.trim().length > 10) {
        return envKey.trim();
      }
      const localKey = localStorage.getItem('rblock_gemini_api_key');
      if (localKey && localKey.trim().length > 10) {
        return localKey.trim();
      }
    } catch {}
    return null;
  }

  /**
   * Memanggil Gemini API (via Client Key jika tersedia, atau via Cloudflare Pages Function /api/shoutcaster)
   */
  private async fetchGeminiCommentary(prompt: string): Promise<string | null> {
    const clientKey = this.getClientApiKey();

    // 1. Jika ada VITE_GEMINI_API_KEY atau key lokal, panggil Gemini 2.5 Flash langsung
    if (clientKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SHOUTCASTER_SYSTEM_PROMPT }]
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 75
              }
            })
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return text.replace(/^["']|["']$/g, '');
        }
      } catch {
        // Lanjut ke endpoint serverless atau fallback lokal
      }
    }

    // 2. Panggil endpoint Cloudflare Pages Function / Express (/api/shoutcaster)
    try {
      const res = await fetch('/api/shoutcaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.comment) {
          return data.comment;
        }
      }
    } catch {
      // Offline atau endpoint tidak tersedia
    }

    return null;
  }

  /**
   * Observer utama yang dipanggil dari Game Loop / Event Handler
   */
  public async notifyEvent(payload: ShoutcasterEventPayload): Promise<void> {
    if (!this.enabled) return;

    const now = Date.now();

    // Cooldown khusus untuk kondisi kritis agar tidak spam setiap tick
    if (payload.type === 'critical_stack') {
      if (now - this.lastCriticalAlertTimestamp < 18000) {
        return;
      }
      this.lastCriticalAlertTimestamp = now;
    } else if (payload.type !== 'victory' && payload.type !== 'game_over' && payload.type !== 'game_start') {
      // Cooldown umum antar komentar (minimal 4.5 detik)
      if (now - this.lastCallTimestamp < 4500) {
        return;
      }
    }

    this.lastCallTimestamp = now;
    const mood = this.resolveMood(payload.type);

    // Tampilkan respons instan terlebih dahulu atau tunggu Gemini dengan batas waktu cepat
    const prompt = this.buildDynamicPrompt(payload);

    if (this.isFetching) {
      this.emit({
        id: ++this.messageCounter,
        text: this.getFallbackComment(payload),
        mood,
        eventType: payload.type,
        source: 'local_ai',
        timestamp: now
      });
      return;
    }

    this.isFetching = true;
    try {
      const aiText = await this.fetchGeminiCommentary(prompt);
      this.emit({
        id: ++this.messageCounter,
        text: aiText || this.getFallbackComment(payload),
        mood,
        eventType: payload.type,
        source: aiText ? 'gemini' : 'local_ai',
        timestamp: Date.now()
      });
    } finally {
      this.isFetching = false;
    }
  }
}

export const aiShoutcaster = new AIShoutcasterService();
