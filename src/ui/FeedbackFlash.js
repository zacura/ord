import { Graphics } from 'pixi.js';

export const FLASH_COLORS = Object.freeze({
  heard: 0x4caf50,
  missed: 0xf44336,
});

const VIBRATION = Object.freeze({
  heard: 40,
  missed: [80, 60, 80],
});

const FLASH_MS = 500;
const PEAK_ALPHA = 0.35;

export class FeedbackFlash extends Graphics {
  constructor({ width, height, reducedMotion = false }) {
    super();
    this.reducedMotion = reducedMotion;
    this.rect(0, 0, width, height).fill(0xffffff);
    this.alpha = 0;
    this.elapsed = FLASH_MS;
  }

  // outcome is 'heard' or 'missed', matching Game results.
  // With reduced motion the tint is held steady and then removed, with no fade.
  play(outcome) {
    this.tint = FLASH_COLORS[outcome];
    this.elapsed = 0;
    this.alpha = PEAK_ALPHA;
    globalThis.navigator?.vibrate?.(VIBRATION[outcome]);
  }

  update(deltaMS) {
    if (this.elapsed >= FLASH_MS) return;

    this.elapsed = Math.min(FLASH_MS, this.elapsed + deltaMS);
    if (this.reducedMotion) {
      this.alpha = this.elapsed < FLASH_MS ? PEAK_ALPHA : 0;
      return;
    }
    this.alpha = PEAK_ALPHA * (1 - this.elapsed / FLASH_MS);
  }
}
