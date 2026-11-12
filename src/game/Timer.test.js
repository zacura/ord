import { describe, expect, it, vi } from 'vitest';
import { Timer, WORD_TIME_MS } from './Timer.js';

describe('Timer', () => {
  it('counts down from the word time limit using the supplied delta', () => {
    const timer = new Timer();
    timer.start();
    timer.update(2_500);

    expect(timer.remaining).toBe(WORD_TIME_MS - 2_500);
    expect(timer.progress).toBeCloseTo(0.75);
  });

  it('ignores updates while paused and resumes counting afterwards', () => {
    const timer = new Timer();
    timer.start();
    timer.update(1_000);
    timer.pause();
    timer.update(5_000);
    expect(timer.remaining).toBe(WORD_TIME_MS - 1_000);

    timer.resume();
    timer.update(1_000);
    expect(timer.remaining).toBe(WORD_TIME_MS - 2_000);
  });

  it('fires onExpire once when the limit is reached and clamps at zero', () => {
    const onExpire = vi.fn();
    const timer = new Timer(WORD_TIME_MS, { onExpire });
    timer.start();
    timer.update(WORD_TIME_MS + 500);
    timer.update(1_000);

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(timer.remaining).toBe(0);
    expect(timer.progress).toBe(0);
  });

  it('does not run before start or after stop', () => {
    const onExpire = vi.fn();
    const timer = new Timer(1_000, { onExpire });
    timer.update(500);
    expect(timer.remaining).toBe(1_000);

    timer.start();
    timer.stop();
    timer.update(2_000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('resets elapsed time when restarted', () => {
    const timer = new Timer();
    timer.start();
    timer.update(4_000);
    timer.start();

    expect(timer.remaining).toBe(WORD_TIME_MS);
  });
});
