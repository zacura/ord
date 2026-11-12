import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, emptyStats, loadStats, saveStats, recordResults, missWeight } from './stats.js';

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
};

describe('stats persistence', () => {
  it('round-trips saved stats through storage', () => {
    const storage = memoryStorage();
    const stats = { bestScore: 4, words: { hund: { heard: 2, missed: 1 } } };

    saveStats(stats, storage);
    expect(loadStats(storage)).toEqual(stats);
  });

  it('falls back to empty stats when stored data is corrupt', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');

    expect(loadStats(storage)).toEqual(emptyStats());
  });
});

describe('recordResults', () => {
  it('accumulates per-word counts and keeps the best score', () => {
    const hund = { word: 'hund' };
    const katt = { word: 'katt' };
    const first = recordResults(emptyStats(), [
      { word: hund, outcome: 'heard' },
      { word: katt, outcome: 'missed' },
    ]);
    const second = recordResults(first, [{ word: katt, outcome: 'heard' }]);

    expect(second.bestScore).toBe(1);
    expect(second.words).toEqual({
      hund: { heard: 1, missed: 0 },
      katt: { heard: 1, missed: 1 },
    });
  });

  it('does not lower the best score after a worse session', () => {
    const strong = recordResults(emptyStats(), [{ word: { word: 'bok' }, outcome: 'heard' }]);
    const weak = recordResults(strong, [{ word: { word: 'bok' }, outcome: 'missed' }]);

    expect(weak.bestScore).toBe(1);
  });
});

describe('missWeight', () => {
  it('gives words that were missed more weight than unseen words', () => {
    const stats = { bestScore: 0, words: { katt: { heard: 0, missed: 2 } } };

    expect(missWeight(stats, 'katt')).toBeGreaterThan(missWeight(stats, 'hund'));
  });
});
