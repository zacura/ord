export const DIFFICULTY_KEY = 'ord.difficulty';

// Each difficulty includes words up to `maxLevel`, so harder settings extend easier ones.
export const DIFFICULTIES = Object.freeze([
  { id: 'easy', label: 'Easy', maxLevel: 1 },
  { id: 'medium', label: 'Medium', maxLevel: 2 },
  { id: 'hard', label: 'Hard', maxLevel: 3 },
]);

export const DEFAULT_DIFFICULTY = 'easy';

export function wordsForDifficulty(words, difficultyId) {
  const { maxLevel } = DIFFICULTIES.find((entry) => entry.id === difficultyId) ?? DIFFICULTIES[0];
  return words.filter((entry) => entry.level <= maxLevel);
}

export function loadDifficulty(storage = globalThis.localStorage) {
  try {
    const stored = storage?.getItem(DIFFICULTY_KEY);
    return DIFFICULTIES.some((entry) => entry.id === stored) ? stored : DEFAULT_DIFFICULTY;
  } catch {
    return DEFAULT_DIFFICULTY;
  }
}

export function saveDifficulty(difficultyId, storage = globalThis.localStorage) {
  try {
    storage?.setItem(DIFFICULTY_KEY, difficultyId);
  } catch {
    // Storage may be unavailable; the choice just won't persist.
  }
}
