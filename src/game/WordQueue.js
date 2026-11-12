export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class WordQueue {
  constructor(words, random = Math.random) {
    this.items = shuffle(words, random);
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
