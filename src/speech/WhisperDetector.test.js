import { describe, expect, it, vi } from 'vitest';
import { WhisperDetector } from './WhisperDetector.js';

function fakeWorker() {
  return {
    sent: [],
    onmessage: null,
    postMessage(message) {
      this.sent.push(message);
    },
    reply(data) {
      this.onmessage({ data });
    },
  };
}

// Every pushed chunk is treated as a finished utterance, so tests control the job count directly.
const fakeVad = () => ({ reset: vi.fn(), push: (chunk) => chunk });

const audio = () => new Float32Array([0.1, 0.2]);

function setup() {
  const worker = fakeWorker();
  const detector = new WhisperDetector({ worker, vad: fakeVad() });
  const onHeard = vi.fn();
  const onError = vi.fn();
  detector.onHeard = onHeard;
  detector.onError = onError;
  return { worker, detector, onHeard, onError };
}

describe('WhisperDetector', () => {
  it('calls onHeard once when the transcript matches the word', () => {
    const { worker, detector, onHeard } = setup();
    detector.start('hund');
    detector.pushAudio(audio());

    const { id } = worker.sent.at(-1);
    worker.reply({ type: 'result', id, text: 'Hund.' });
    worker.reply({ type: 'result', id, text: 'hund' });

    expect(onHeard).toHaveBeenCalledTimes(1);
  });

  it('does not call onHeard when the transcript does not match', () => {
    const { worker, detector, onHeard } = setup();
    detector.start('hund');
    detector.pushAudio(audio());

    const { id } = worker.sent.at(-1);
    worker.reply({ type: 'result', id, text: 'katt' });

    expect(onHeard).not.toHaveBeenCalled();
  });

  it('ignores a late result that arrives after stop()', () => {
    const { worker, detector, onHeard } = setup();
    detector.start('hund');
    detector.pushAudio(audio());

    const { id } = worker.sent.at(-1);
    detector.stop();
    worker.reply({ type: 'result', id, text: 'hund' });

    expect(onHeard).not.toHaveBeenCalled();
  });

  it('ignores a result that belongs to the previous word', () => {
    const { worker, detector, onHeard } = setup();
    detector.start('hund');
    detector.pushAudio(audio());
    const { id } = worker.sent.at(-1);

    detector.start('katt');
    worker.reply({ type: 'result', id, text: 'hund' });

    expect(onHeard).not.toHaveBeenCalled();
  });

  it('reports unavailable when the model fails to load', async () => {
    const { worker, detector, onError } = setup();
    const loading = detector.load('http://localhost/');
    worker.reply({ type: 'error', message: 'no model' });

    await expect(loading).rejects.toThrow('no model');
    expect(onError).toHaveBeenCalledWith('unavailable');
  });
});
