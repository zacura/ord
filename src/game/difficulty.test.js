import { describe, expect, it } from 'vitest';
import { DEFAULT_DIFFICULTY, loadDifficulty, wordsForDifficulty } from './difficulty.js';

const words = [
  { word: 'hund', level: 1 },
  { word: 'röd', level: 2 },
  { word: 'ljus', level: 3 },
];

describe('wordsForDifficulty', () => {
  it('includes words up to the difficulty ceiling', () => {
    expect(wordsForDifficulty(words, 'easy').map((entry) => entry.word)).toEqual(['hund']);
    expect(wordsForDifficulty(words, 'medium').map((entry) => entry.word)).toEqual(['hund', 'röd']);
    expect(wordsForDifficulty(words, 'hard')).toHaveLength(3);
  });
});

describe('loadDifficulty', () => {
  it('falls back to the default when the stored value is not a known difficulty', () => {
    const storage = { getItem: () => 'expert' };

    expect(loadDifficulty(storage)).toBe(DEFAULT_DIFFICULTY);
  });
});
