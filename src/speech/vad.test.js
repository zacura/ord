import { describe, expect, it } from 'vitest';
import { VoiceActivityDetector } from './vad.js';

const SAMPLE_RATE = 16000;
const CHUNK = 512;

const silence = (ms) => new Float32Array(Math.round((ms * SAMPLE_RATE) / 1000));

function noise(ms, amplitude) {
  let seed = 12345;
  const out = new Float32Array(Math.round((ms * SAMPLE_RATE) / 1000));
  for (let i = 0; i < out.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    out[i] = (seed / 0x7fffffff * 2 - 1) * amplitude;
  }
  return out;
}

function tone(ms, amplitude) {
  const out = new Float32Array(Math.round((ms * SAMPLE_RATE) / 1000));
  for (let i = 0; i < out.length; i++) out[i] = amplitude * Math.sin((2 * Math.PI * 200 * i) / SAMPLE_RATE);
  return out;
}

function concat(parts) {
  const out = new Float32Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function feed(vad, samples) {
  const utterances = [];
  for (let i = 0; i < samples.length; i += CHUNK) {
    const utterance = vad.push(samples.subarray(i, i + CHUNK));
    if (utterance) utterances.push(utterance);
  }
  return utterances;
}

const msOf = (samples) => (samples.length * 1000) / SAMPLE_RATE;

describe('VoiceActivityDetector', () => {
  it('emits nothing for silence', () => {
    expect(feed(new VoiceActivityDetector(), silence(3000))).toEqual([]);
  });

  it('emits nothing for background noise at the noise floor', () => {
    const background = noise(3000, 0.01);
    expect(feed(new VoiceActivityDetector(), background)).toEqual([]);
  });

  it('emits one utterance for a burst with pre-roll and hangover', () => {
    const vad = new VoiceActivityDetector();
    const utterances = feed(vad, concat([noise(1000, 0.01), tone(600, 0.5), silence(1000)]));

    expect(utterances).toHaveLength(1);
    expect(msOf(utterances[0])).toBeGreaterThan(1000);
    expect(msOf(utterances[0])).toBeLessThan(1250);
  });

  it('drops a burst shorter than the minimum utterance length', () => {
    const vad = new VoiceActivityDetector();
    expect(feed(vad, concat([noise(1000, 0.01), tone(120, 0.5), silence(1000)]))).toEqual([]);
  });

  it('cuts a long burst at the maximum utterance length', () => {
    const vad = new VoiceActivityDetector();
    const utterances = feed(vad, concat([noise(1000, 0.01), tone(6000, 0.5), silence(1000)]));

    expect(utterances).toHaveLength(2);
    expect(msOf(utterances[0])).toBeGreaterThanOrEqual(4000);
    expect(msOf(utterances[0])).toBeLessThan(4100);
    expect(msOf(utterances[1])).toBeLessThanOrEqual(4000);
  });
});
