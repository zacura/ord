export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Weighted random ordering (Efraimidis–Spirakis): higher weights tend to come first.
export function weightedShuffle(items, weightOf, random = Math.random) {
  return items
    .map((item) => ({ item, key: random() ** (1 / weightOf(item)) }))
    .sort((a, b) => b.key - a.key)
    .map(({ item }) => item);
}

export class WordQueue {
  constructor(words, random = Math.random, weightOf = null) {
    this.items = weightOf ? weightedShuffle(words, weightOf, random) : shuffle(words, random);
    this.index = 0;
  }

  next() {
    if (this.isDone()) return null;
    return this.items[this.index++];
  }

  isDone() {
    return this.index >= this.items.length;
  }

  get remaining() {
    return this.items.length - this.index;
  }
}
