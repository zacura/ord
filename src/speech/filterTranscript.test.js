import { describe, expect, it } from 'vitest';
import { filterTranscript } from './filterTranscript.js';

describe('filterTranscript', () => {
  it('keeps a normal word, including å/ä/ö', () => {
    expect(filterTranscript(' Bär. ')).toBe('Bär.');
    expect(filterTranscript('en hund')).toBe('en hund');
  });

  it('drops empty and whitespace-only output', () => {
    expect(filterTranscript('')).toBe('');
    expect(filterTranscript('   ')).toBe('');
    expect(filterTranscript(null)).toBe('');
  });

  it('drops bracketed, parenthesised and music tags', () => {
    expect(filterTranscript('[Musik]')).toBe('');
    expect(filterTranscript('(musik)')).toBe('');
    expect(filterTranscript('♪ ♫')).toBe('');
    expect(filterTranscript('[Musik] hund')).toBe('hund');
  });

  it('drops text that repeats one token in a row', () => {
    expect(filterTranscript('hund hund hund')).toBe('');
    expect(filterTranscript('ja ja ja ja')).toBe('');
  });

  it('keeps a token that repeats only twice', () => {
    expect(filterTranscript('ja ja')).toBe('ja ja');
  });
});
