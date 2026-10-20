class PlayfulAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  public muted: boolean = false;
  public volume: number = 0.8;

  constructor() {
    try {
      const savedVolume = localStorage.getItem('rblock_sfx_volume');
      if (savedVolume !== null) {
        const parsed = parseFloat(savedVolume);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch (e) {}
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.createNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    try {
      localStorage.setItem('rblock_sfx_volume', this.volume.toString());
    } catch (e) {}
  }

  playChime(freq: number, duration: number = 0.12, type: OscillatorType = 'sine', volume: number = 0.12) {
    if (this.muted || !this.ctx || this.volume <= 0) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const effectiveVolume = volume * this.volume;
      gain.gain.setValueAtTime(effectiveVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playVolumePreview() {
    this.init();
    if (this.muted || this.volume <= 0) return;
    this.playChime(523, 0.08, 'sine', 0.12);
    setTimeout(() => {
      this.playChime(659, 0.12, 'sine', 0.14);
    }, 90);
  }

  playMove() {
    this.playChime(420, 0.06, 'triangle', 0.05);
  }

  playRotate() {
    this.playChime(580, 0.08, 'sine', 0.08);
  }

  playDrop() {
    this.playChime(220, 0.1, 'triangle', 0.1);
  }

  playSoftLock() {
    this.playDrop();
  }

  playBombExplosion() {
    this.playExplosion();
  }

  playLineClear(isMega: boolean = false) {
    if (this.muted || !this.ctx || this.volume <= 0) return;
    const notes = isMega ? [440, 554, 659, 880] : [523, 659, 784];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.18, 'sine', 0.14);
      }, idx * 60);
    });
  }

  playExplosion() {
    if (this.muted || !this.ctx || !this.noiseBuffer || this.volume <= 0) return;
    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + 0.6);

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.5);

      subGain.gain.setValueAtTime(0.4 * this.volume, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  }

  playFuseTick(urgent: boolean = false) {
    if (this.muted || !this.ctx || this.volume <= 0) return;
    const freq = urgent ? 880 : 540;
    this.playChime(freq, 0.05, 'square', urgent ? 0.09 : 0.04);
  }

  playGameOver() {
    if (this.muted || !this.ctx || this.volume <= 0) return;
    const notes = [392, 349, 311, 261];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.25, 'sawtooth', 0.12);
      }, idx * 100);
    });
  }

  playVictory() {
    if (this.muted || !this.ctx || this.volume <= 0) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.2, 'sine', 0.16);
      }, idx * 80);
    });
  }
}

export const sfx = new PlayfulAudio();
