import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoSpeechDetector, detectorOverride } from './createSpeechDetector.js';

vi.mock('./micPermission.js', () => ({ requestMicrophone: vi.fn(async () => 'granted') }));
vi.mock('./micStream.js', () => ({
  acquireMicStream: vi.fn(async () => ({})),
  releaseMicStream: vi.fn(),
}));

const fakeWhisper = (load) => ({
  load: vi.fn(load),
  start: vi.fn(),
  stop: vi.fn(),
  pushAudio: vi.fn(),
});
const fakeCapture = () => ({ start: vi.fn(async () => {}), stop: vi.fn(), onChunk: null });
const fakeRecognition = () => ({ start: vi.fn(), stop: vi.fn(), onHeard: null, onError: null });
const fakeSelfReport = () => ({ start: vi.fn(), stop: vi.fn(), onHeard: null });

describe('AutoSpeechDetector', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses Whisper once the model has loaded', async () => {
    const whisper = fakeWhisper(async () => {});
    const detector = new AutoSpeechDetector({
      whisper,
      capture: fakeCapture(),
      modelBaseUrl: 'http://localhost/',
      recognition: fakeRecognition(),
      selfReport: fakeSelfReport(),
    });

    await detector.prepare();
    detector.start('hund');

    expect(detector.mode).toBe('whisper');
    expect(whisper.start).toHaveBeenCalledWith('hund');
  });

  it('preloads the model once and reuses it when the round starts', async () => {
    const whisper = fakeWhisper(async () => {});
    const detector = new AutoSpeechDetector({
      whisper,
      capture: fakeCapture(),
      modelBaseUrl: 'http://localhost/',
      recognition: fakeRecognition(),
      selfReport: fakeSelfReport(),
    });

    detector.preload();
    detector.preload();
    await detector.prepare();

    expect(whisper.load).toHaveBeenCalledTimes(1);
    expect(detector.modelStatus).toBe('ready');
  });

  it('restarts capture after the tab is shown again', async () => {
    const capture = fakeCapture();
    const detector = new AutoSpeechDetector({
      whisper: fakeWhisper(async () => {}),
      capture,
      modelBaseUrl: 'http://localhost/',
      recognition: null,
      selfReport: fakeSelfReport(),
    });

    await detector.prepare();
    detector.pauseAudio();
    expect(capture.stop).toHaveBeenCalled();

    await detector.resumeAudio();
    expect(capture.start).toHaveBeenCalledTimes(2);
  });

  it('falls back to recognition when the model fails to load', async () => {
    const whisper = fakeWhisper(async () => {
      throw new Error('model missing');
    });
    const recognition = fakeRecognition();
    const detector = new AutoSpeechDetector({
      whisper,
      capture: fakeCapture(),
      modelBaseUrl: 'http://localhost/',
      recognition,
      selfReport: fakeSelfReport(),
    });

    await detector.prepare();
    detector.start('hund');

    expect(detector.mode).toBe('recognition');
    expect(recognition.start).toHaveBeenCalledWith('hund');
    expect(whisper.start).not.toHaveBeenCalled();
  });
});

describe('detectorOverride', () => {
  it('reads the detector flag and ignores unknown values', () => {
    expect(detectorOverride('?detector=native')).toBe('native');
    expect(detectorOverride('?detector=manual')).toBe('manual');
    expect(detectorOverride('?detector=whisper')).toBe('whisper');
    expect(detectorOverride('?detector=bogus')).toBeNull();
    expect(detectorOverride('')).toBeNull();
  });
});
