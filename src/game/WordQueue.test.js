import { describe, expect, it } from 'vitest';
import { WordQueue } from './WordQueue.js';

const words = ['hund', 'katt', 'bok', 'äpple', 'öga', 'åka'];

describe('WordQueue', () => {
  it('yields every word exactly once, then reports done', () => {
    const queue = new WordQueue(words);
    const seen = [];
    while (!queue.isDone()) seen.push(queue.next());

    expect([...seen].sort()).toEqual([...words].sort());
    expect(queue.next()).toBeNull();
  });

  it('shuffles the order using the provided random source', () => {
    const reversed = new WordQueue(words, () => 0);
    const order = [];
    while (!reversed.isDone()) order.push(reversed.next());

    expect(order).not.toEqual(words);
  });

  it('does not mutate the input array', () => {
    const input = [...words];
    new WordQueue(input);
    expect(input).toEqual(words);
  });
});
