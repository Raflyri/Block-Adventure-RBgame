import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptic Vibration Service for RBlock Adventure
 * Uses Capacitor Native Haptics on Android/iOS and falls back to
 * Web Vibration API (navigator.vibrate) on web & PWAs.
 */

class HapticsService {
  public enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('rblock_haptics_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  public isNative(): boolean {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  /**
   * Check if haptics are supported on the current device (Native Capacitor or Web Vibration API)
   */
  public isSupported(): boolean {
    if (this.isNative()) return true;
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    );
  }

  public isEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('rblock_haptics_enabled', enabled ? 'true' : 'false');
    } catch {}
    if (!enabled) {
      this.cancel();
    }
  }

  public cancel(): boolean {
    if (!this.isNative() && this.isSupported()) {
      try {
        return navigator.vibrate(0);
      } catch {
        return false;
      }
    }
    return false;
  }

  public vibrate(pattern: number | number[]): boolean {
    if (!this.enabled || !this.isSupported()) {
      return false;
    }
    if (this.isNative()) {
      const duration = Array.isArray(pattern)
        ? pattern.reduce((a, b) => a + b, 0)
        : pattern;
      Haptics.vibrate({ duration: Math.min(duration, 400) }).catch(() => {});
      return true;
    }
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }

  public menuTap() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      return;
    }
    this.vibrate(18);
  }

  public move() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      return;
    }
    this.vibrate(12);
  }

  public rotate() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      return;
    }
    this.vibrate([14, 10, 14]);
  }

  public softDrop() {
    this.vibrate(10);
  }

  public hardDrop() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      return;
    }
    this.vibrate([45, 25, 25]);
  }

  public pieceLock() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      return;
    }
    this.vibrate(22);
  }

  public hold() {
    this.vibrate([16, 20, 18]);
  }

  public lineClear(linesCount: number = 1) {
    if (!this.enabled) return;
    if (this.isNative() && linesCount >= 4) {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }
    if (linesCount <= 1) {
      this.vibrate([35, 40, 40]);
    } else if (linesCount === 2) {
      this.vibrate([40, 35, 50, 35, 60]);
    } else if (linesCount === 3) {
      this.vibrate([45, 30, 60, 30, 80]);
    } else {
      this.vibrate([55, 35, 75, 35, 95, 40, 140]);
    }
  }

  public sandBridgeClear(clustersCount: number = 1) {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }
    if (clustersCount <= 1) {
      this.vibrate([35, 30, 50]);
    } else {
      this.vibrate([45, 30, 65, 30, 90, 40, 110]);
    }
  }

  public bombExplosion() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }
    this.vibrate([60, 30, 90, 40, 130]);
  }

  public gameOver() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.notification({ type: NotificationType.Error }).catch(() => {});
    }
    this.vibrate([80, 50, 100, 50, 150]);
  }

  public victory() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }
    this.vibrate([50, 40, 60, 40, 80, 40, 120]);
  }

  public test() {
    if (!this.enabled) return;
    if (this.isNative()) {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }
    this.vibrate([30, 40, 45, 40, 60]);
  }
}

export const haptics = new HapticsService();
