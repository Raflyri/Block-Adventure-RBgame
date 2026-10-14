import { LeaderboardEntry } from '../types/game';
import { DEFAULT_CLASSIC_LEADERBOARD, DEFAULT_DAILY_LEADERBOARD } from '../constants/game';
import { getTodayDateString } from './prng';

export class LeaderboardService {
  static isOnline: boolean = false;

  static getLocalScores(mode: 'classic' | 'daily' = 'classic'): LeaderboardEntry[] {
    const key = mode === 'daily' ? `rblock_lb_daily_${getTodayDateString()}` : 'rblock_leaderboard_local';
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mode === 'daily' ? [...DEFAULT_DAILY_LEADERBOARD] : [...DEFAULT_CLASSIC_LEADERBOARD];
  }

  static saveLocalScore(name: string, score: number, mode: 'classic' | 'daily' = 'classic'): LeaderboardEntry[] {
    const key = mode === 'daily' ? `rblock_lb_daily_${getTodayDateString()}` : 'rblock_leaderboard_local';
    const list = this.getLocalScores(mode);
    list.push({ name, score, date: new Date().toISOString() });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 50);
    try {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {}
    return trimmed;
  }

  static async fetchScores(mode: 'classic' | 'daily' = 'classic'): Promise<{ scores: LeaderboardEntry[]; source: string }> {
    try {
      const response = await fetch(`/api/leaderboard?mode=${mode}&date=${getTodayDateString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          this.isOnline = true;
          return {
            scores: data.leaderboard,
            source: data.source || 'backend_api'
          };
        }
      }
    } catch (err) {
      this.isOnline = false;
    }
    return {
      scores: this.getLocalScores(mode).slice(0, 10),
      source: 'local_storage'
    };
  }

  static async submitScore(
    playerName: string,
    score: number,
    mode: 'classic' | 'daily' = 'classic'
  ): Promise<{ success: boolean; rank?: number | null; message: string }> {
    const sanitizedName = (playerName || 'Player').trim().slice(0, 12);
    try {
      localStorage.setItem('rblock_player_name', sanitizedName);
    } catch (e) {}

    this.saveLocalScore(sanitizedName, score, mode);

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sanitizedName, score, mode })
      });

      if (response.ok) {
        const data = await response.json();
        this.isOnline = true;
        return {
          success: true,
          rank: data.rank,
          message: data.message || `Luar biasa! Skor tersimpan di Leaderboard! 🌟`
        };
      }
    } catch (err) {
      this.isOnline = false;
    }

    return {
      success: true,
      message: `Yay! Skor ${score} dicatat untuk ${sanitizedName}! ⭐ (Tersimpan di rekor lokal)`
    };
  }
}
