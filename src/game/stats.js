export const STORAGE_KEY = 'ord.stats';

export function emptyStats() {
  return { bestScore: 0, words: {} };
}

// Falls back to empty stats when storage is unavailable or holds invalid data.
export function loadStats(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return emptyStats();
    return { bestScore: parsed.bestScore ?? 0, words: parsed.words ?? {} };
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage may be full or disabled; stats simply aren't persisted.
  }
}

// Returns a new stats object including the finished session's results.
export function recordResults(stats, results) {
  const words = { ...stats.words };
  let score = 0;

  for (const { word, outcome } of results) {
    const entry = words[word.word] ?? { heard: 0, missed: 0 };
    if (outcome === 'heard') {
      entry.heard += 1;
      score += 1;
    } else {
      entry.missed += 1;
    }
    words[word.word] = entry;
  }

  return { bestScore: Math.max(stats.bestScore, score), words };
}

// Missed words get a higher chance to appear early in the next session.
export function missWeight(stats, wordText) {
  return 1 + (stats.words[wordText]?.missed ?? 0);
}
