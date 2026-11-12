import { SpeechDetector } from './SpeechDetector.js';
import { matchWord } from './matchWord.js';
import { VoiceActivityDetector } from './vad.js';

// Whisper is not streaming: the VAD cuts the mic into utterances and each one is transcribed by the worker.
export class WhisperDetector extends SpeechDetector {
  constructor({ worker, vad = new VoiceActivityDetector() } = {}) {
    super();
    this.worker = worker;
    this.vad = vad;
    this.target = null;
    this.jobs = new Map();
    this.nextJobId = 1;
    this.loading = null;
    this.onProgress = null;

    this.worker.onmessage = (event) => this.handleMessage(event.data);
  }

  load(baseUrl) {
    return new Promise((resolve, reject) => {
      this.loading = { resolve, reject };
      this.worker.postMessage({ type: 'load', baseUrl });
    });
  }

  start(target) {
    this.stop();
    this.target = target;
    this.vad.reset();
  }

  stop() {
    this.target = null;
    // Clearing the jobs makes results that arrive later, for this word or an earlier one, get ignored.
    this.jobs.clear();
    this.vad.reset();
  }

  pushAudio(chunk) {
    if (!this.target) return;
    const utterance = this.vad.push(chunk);
    if (utterance) this.transcribe(utterance);
  }

  transcribe(audio) {
    const id = this.nextJobId++;
    this.jobs.set(id, { word: this.target });
    this.worker.postMessage({ type: 'transcribe', id, audio }, [audio.buffer]);
  }

  handleMessage(message) {
    if (message.type === 'progress') {
      this.onProgress?.(message.progress);
    } else if (message.type === 'ready') {
      this.loading?.resolve();
      this.loading = null;
    } else if (message.type === 'error' && message.id === undefined) {
      this.loading?.reject(new Error(message.message));
      this.loading = null;
      this.onError?.('unavailable');
    } else if (message.type === 'result' || message.type === 'error') {
      this.handleResult(message);
    }
  }

  handleResult(message) {
    const job = this.jobs.get(message.id);
    this.jobs.delete(message.id);
    if (!job || message.type !== 'result') return;
    if (!this.target || job.word !== this.target) return;

    if (matchWord(message.text, this.target)) this.finish();
  }

  finish() {
    const onHeard = this.onHeard;
    this.stop();
    onHeard?.();
  }
}
