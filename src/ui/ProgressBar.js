import { Container, Graphics } from 'pixi.js';

export const BAR_COLORS = Object.freeze({
  high: 0x4caf50,
  medium: 0xffc107,
  low: 0xf44336,
});

export const MEDIUM_THRESHOLD = 0.5;
export const LOW_THRESHOLD = 0.25;

export function colorFor(progress) {
  if (progress <= LOW_THRESHOLD) return BAR_COLORS.low;
  if (progress <= MEDIUM_THRESHOLD) return BAR_COLORS.medium;
  return BAR_COLORS.high;
}

export class ProgressBar extends Container {
  constructor({ width, height = 14, radius = 7, trackColor = 0x2a2e38 }) {
    super();
    this.barWidth = width;
    this.barHeight = height;
    this.radius = radius;

    this.track = new Graphics().roundRect(0, 0, width, height, radius).fill(trackColor);
    this.bar = new Graphics();
    this.addChild(this.track, this.bar);
  }

  // progress is 0–1 (remaining share of the word time); 1 is full and 0 is empty.
  setProgress(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    const width = this.barWidth * clamped;

    this.bar.clear();
    if (width > 0) {
      this.bar.roundRect(0, 0, width, this.barHeight, this.radius).fill(colorFor(clamped));
    }
  }
}
