import { describe, expect, it } from 'vitest';
import { loadReducedMotion, MOTION_KEY, saveReducedMotion } from './motion.js';

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
};

const systemPreference = (reduce) => ({ matchMedia: () => ({ matches: reduce }) });

describe('reduced motion setting', () => {
  it('follows the system preference when nothing is saved', () => {
    expect(loadReducedMotion(memoryStorage(), systemPreference(true))).toBe(true);
    expect(loadReducedMotion(memoryStorage(), systemPreference(false))).toBe(false);
  });

  it('prefers the saved choice over the system preference', () => {
    const storage = memoryStorage({ [MOTION_KEY]: 'false' });
    expect(loadReducedMotion(storage, systemPreference(true))).toBe(false);
  });

  it('round-trips a saved choice', () => {
    const storage = memoryStorage();
    saveReducedMotion(true, storage);
    expect(loadReducedMotion(storage, systemPreference(false))).toBe(true);
  });
});
