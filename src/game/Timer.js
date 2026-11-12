export const WORD_TIME_MS = 10_000;

export class Timer {
  constructor(durationMS = WORD_TIME_MS, { onExpire = null } = {}) {
    this.duration = durationMS;
    this.onExpire = onExpire;
    this.elapsed = 0;
    this.running = false;
    this.paused = false;
  }

  start() {
    this.elapsed = 0;
    this.running = true;
    this.paused = false;
  }

  stop() {
    this.running = false;
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  update(deltaMS) {
    if (!this.running || this.paused) return;

    this.elapsed = Math.min(this.duration, this.elapsed + deltaMS);
    if (this.elapsed >= this.duration) {
      this.running = false;
      this.onExpire?.();
    }
  }

  get remaining() {
    return this.duration - this.elapsed;
  }

  get progress() {
    return this.remaining / this.duration;
  }
}
