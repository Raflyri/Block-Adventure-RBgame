/**
 * Haptic Vibration Service for RBlock Adventure
 * Uses the Web Vibration API (navigator.vibrate) to deliver tactile feedback
 * on mobile devices, PWAs, and Android native webviews (Capacitor).
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

  /**
   * Check if the Vibration API is supported on the current device & browser
   */
  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    );
  }

  /**
   * Check if haptic feedback is currently enabled by the user
   */
  public isEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  /**
   * Toggle or set haptic feedback enabled state
   */
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('rblock_haptics_enabled', enabled ? 'true' : 'false');
    } catch {}
    if (!enabled) {
      this.cancel();
    }
  }

  /**
   * Cancel any active vibration
   */
  public cancel(): boolean {
    if (this.isSupported()) {
      try {
        return navigator.vibrate(0);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Core execution of vibration pattern with safety checks and error suppression
   */
  public vibrate(pattern: number | number[]): boolean {
    if (!this.enabled || !this.isSupported()) {
      return false;
    }
    try {
      return navigator.vibrate(pattern);
    } catch {
      // Suppress potential SecurityError or UserActivation requirement errors
      return false;
    }
  }

  /**
   * Haptic feedback for UI menu interactions (buttons, tabs, modal close/open)
   */
  public menuTap() {
    this.vibrate(18);
  }

  /**
   * Light tactile feedback for piece shift (left / right move)
   */
  public move() {
    this.vibrate(12);
  }

  /**
   * Subtle snappy tap for piece rotation
   */
  public rotate() {
    this.vibrate([14, 10, 14]);
  }

  /**
   * Micro vibration on soft drop tick
   */
  public softDrop() {
    this.vibrate(10);
  }

  /**
   * Firm impact vibration when a piece is hard-dropped onto the stack
   */
  public hardDrop() {
    this.vibrate([45, 25, 25]);
  }

  /**
   * Subtle vibration when a piece locks into the grid or sand settles
   */
  public pieceLock() {
    this.vibrate(22);
  }

  /**
   * Tactile pulse when piece is put into pocket (hold)
   */
  public hold() {
    this.vibrate([16, 20, 18]);
  }

  /**
   * Rich haptic feedback scaled to the number of cleared lines (Classic / Daily / Puzzle)
   * Tetris (4 lines) gives an epic multi-pulse celebration!
   */
  public lineClear(linesCount: number = 1) {
    if (linesCount <= 1) {
      // Single line: crisp double tap
      this.vibrate([35, 40, 40]);
    } else if (linesCount === 2) {
      // Double line: progressive pulses
      this.vibrate([40, 35, 50, 35, 60]);
    } else if (linesCount === 3) {
      // Triple line: energetic crescendo
      this.vibrate([45, 30, 60, 30, 80]);
    } else {
      // Tetris (4 lines): Heavy celebratory fanfare pattern
      this.vibrate([55, 35, 75, 35, 95, 40, 140]);
    }
  }

  /**
   * Cascading vibration for Sand Physics bridge clears (connecting left to right)
   */
  public sandBridgeClear(clustersCount: number = 1) {
    if (clustersCount <= 1) {
      this.vibrate([35, 30, 50]);
    } else {
      // Multi-bridge cascade
      this.vibrate([45, 30, 65, 30, 90, 40, 110]);
    }
  }

  /**
   * Intense rumble vibration on candy bomb detonation
   */
  public bombExplosion() {
    this.vibrate([60, 30, 90, 40, 130]);
  }

  /**
   * Descending vibration on Game Over
   */
  public gameOver() {
    this.vibrate([80, 50, 100, 50, 150]);
  }

  /**
   * Celebratory triumphant vibration when player beats stage or daily challenge
   */
  public victory() {
    this.vibrate([50, 40, 60, 40, 80, 40, 120]);
  }

  /**
   * Test preview vibration used in the Settings modal to demonstrate feedback
   */
  public test() {
    this.vibrate([30, 40, 45, 40, 60]);
  }
}

export const haptics = new HapticsService();
