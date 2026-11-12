import { describe, expect, it } from 'vitest';
import { matchWord } from './matchWord.js';

describe('matchWord', () => {
  it('ignores case, surrounding whitespace and punctuation', () => {
    expect(matchWord('  Hund. ', 'hund')).toBe(true);
    expect(matchWord('Öga!', 'öga')).toBe(true);
  });

  it('keeps å, ä and ö significant', () => {
    expect(matchWord('äpple', 'Äpple')).toBe(true);
    expect(matchWord('apple', 'äpple')).toBe(false);
    expect(matchWord('bar', 'bär')).toBe(false);
  });

  it('treats composed and decomposed å/ä/ö as the same letter', () => {
    expect(matchWord('a\u0308pple', 'äpple')).toBe(true);
  });

  it('tolerates small edit distance on longer words only', () => {
    expect(matchWord('hunde', 'hund')).toBe(true);
    expect(matchWord('bock', 'bok')).toBe(false);
    expect(matchWord('bo', 'bok')).toBe(false);
  });

  it('accepts the target word spoken inside a phrase', () => {
    expect(matchWord('en hund', 'hund')).toBe(true);
  });

  it('rejects unrelated and empty transcripts', () => {
    expect(matchWord('katt', 'hund')).toBe(false);
    expect(matchWord('', 'hund')).toBe(false);
    expect(matchWord('hund', '')).toBe(false);
  });
});
