import { SpeechDetector } from './SpeechDetector.js';
import { RecognitionDetector } from './recognition.js';
import { SelfReportDetector } from './selfReport.js';
import { WhisperDetector } from './WhisperDetector.js';
import { AudioCapture } from './audioCapture.js';
import { requestMicrophone } from './micPermission.js';
import { acquireMicStream, releaseMicStream } from './micStream.js';

const LOW_MEMORY_GB = 2;

// Asks the browser to keep the cached model under storage pressure. Best effort: the result is not needed.
function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {});
}

export function isWhisperSupported({ ignoreMemory = false } = {}) {
  if (typeof AudioWorkletNode === 'undefined' || typeof WebAssembly === 'undefined') return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  if (ignoreMemory) return true;
  return !(navigator.deviceMemory && navigator.deviceMemory < LOW_MEMORY_GB);
}

// `?detector=whisper` forces the Whisper tier (ignoring the memory check), `native` skips Whisper,
// and `manual` uses the self-report button only.
export function detectorOverride(search = globalThis.location?.search ?? '') {
  const value = new URLSearchParams(search).get('detector');
  return ['whisper', 'native', 'manual'].includes(value) ? value : null;
}

// Whisper tier: the model loads once in a worker. Recognition and self-report take over until it is ready,
// and if loading fails (or the mic is denied) the tier is dropped for the session.
export class AutoSpeechDetector extends SpeechDetector {
  constructor({
    whisper = null,
    capture = new AudioCapture(),
    modelBaseUrl = null,
    recognition = RecognitionDetector.isSupported() ? new RecognitionDetector() : null,
    selfReport = new SelfReportDetector(),
  } = {}) {
    super();
    this.whisper = whisper;
    this.capture = capture;
    this.modelBaseUrl = modelBaseUrl;
    this.modelReady = false;
    this.modelStatus = 'idle';
    this.modelProgress = null;
    this.loadPromise = null;
    this.roundActive = false;
    this.recognition = recognition;
    this.selfReport = selfReport;
    this.active = null;
    this.target = null;

    this.selfReport.onHeard = () => this.handleHeard();
    if (this.whisper) {
      this.whisper.onHeard = () => this.handleHeard();
      this.whisper.onProgress = (progress) => {
        this.modelProgress = progress;
      };
      this.capture.onChunk = (chunk) => this.whisper?.pushAudio(chunk);
    }
    if (this.recognition) {
      this.recognition.onHeard = () => this.handleHeard();
      this.recognition.onError = (reason) => this.fallBack(reason);
    }
  }

  get mode() {
    if (this.modelReady) return 'whisper';
    return this.recognition ? 'recognition' : 'self-report';
  }

  async prepare() {
    this.roundActive = true;
    if (!this.whisper && !this.recognition) return;

    const result = await requestMicrophone();
    if (result !== 'granted') {
      this.dropWhisper();
      this.fallBack(result);
      return;
    }
    if (this.whisper) await this.startWhisper();
  }

  // Starts loading the model without the mic, so the menu can show progress before the round.
  preload() {
    if (!this.whisper) return;
    requestPersistentStorage();
    this.loadModel().catch(() => {});
  }

  loadModel() {
    if (!this.loadPromise) {
      this.modelStatus = 'loading';
      this.modelProgress = 0;
      this.loadPromise = this.whisper.load(this.modelBaseUrl).then(
        () => {
          this.modelStatus = 'ready';
        },
        (error) => {
          this.modelStatus = 'failed';
          this.dropWhisper();
          throw error;
        },
      );
    }
    return this.loadPromise;
  }

  async startWhisper() {
    try {
      await this.loadModel();
      const stream = await acquireMicStream();
      await this.capture.start(stream);
      this.modelReady = true;
    } catch {
      this.dropWhisper();
    }
  }

  dropWhisper() {
    const wasActive = this.whisper !== null && this.active === this.whisper;
    if (wasActive) this.whisper.stop();
    this.modelReady = false;
    this.whisper = null;
    this.capture.stop();
    if (wasActive) {
      this.active = this.recognition ?? this.selfReport;
      if (this.target) this.active.start(this.target);
    }
  }

  // The tab was hidden: stop capture and release the mic, which the game does not re-open on its own.
  pauseAudio() {
    this.capture.stop();
    releaseMicStream();
  }

  async resumeAudio() {
    if (!this.roundActive || !this.whisper || !this.modelReady) return;
    try {
      await this.capture.start(await acquireMicStream());
    } catch {
      this.dropWhisper();
    }
  }

  releaseAudio() {
    this.roundActive = false;
    this.capture.stop();
    this.modelReady = false;
  }

  start(target) {
    this.stop();
    this.target = target;
    this.active = this.modelReady ? this.whisper : (this.recognition ?? this.selfReport);
    this.active.start(target);
  }

  stop() {
    this.active?.stop();
    this.active = null;
    this.target = null;
  }

  confirm() {
    if (this.active === this.selfReport) this.selfReport.confirm();
  }

  fallBack(reason) {
    this.recognition = null;
    if (this.target) {
      this.active = this.selfReport;
      this.selfReport.start(this.target);
    }
    this.onError?.(reason);
  }

  handleHeard() {
    const onHeard = this.onHeard;
    this.stop();
    onHeard?.();
  }
}

export function createSpeechDetector(override = detectorOverride()) {
  const useWhisper = override !== 'native' && override !== 'manual';
  const whisper = useWhisper && isWhisperSupported({ ignoreMemory: override === 'whisper' })
    ? new WhisperDetector({
        worker: new Worker(new URL('./whisper.worker.js', import.meta.url), { type: 'module' }),
      })
    : null;
  const recognition = override === 'manual' || !RecognitionDetector.isSupported()
    ? null
    : new RecognitionDetector();
  return new AutoSpeechDetector({
    whisper,
    recognition,
    modelBaseUrl: new URL(import.meta.env.BASE_URL, window.location.href).href,
  });
}
