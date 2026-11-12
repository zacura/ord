import { SpeechDetector } from './SpeechDetector.js';
import { matchWord } from './matchWord.js';

const FATAL_ERRORS = {
  'not-allowed': 'denied',
  'service-not-allowed': 'denied',
  'audio-capture': 'unavailable',
  network: 'unavailable',
};

const RESTART_DELAY_MS = 250;

export function getSpeechRecognitionClass() {
  return globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;
}

export class RecognitionDetector extends SpeechDetector {
  constructor(RecognitionClass = getSpeechRecognitionClass()) {
    super();
    this.RecognitionClass = RecognitionClass;
    this.recognition = null;
    this.target = null;
    this.restartTimer = null;
  }

  static isSupported() {
    return getSpeechRecognitionClass() !== null;
  }

  start(target) {
    this.stop();
    this.target = target;
    this.recognition = new this.RecognitionClass();
    Object.assign(this.recognition, {
      lang: 'sv-SE',
      interimResults: true,
      maxAlternatives: 5,
      continuous: true,
    });
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.scheduleRestart();
    this.listen();
  }

  stop() {
    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    const recognition = this.recognition;
    this.recognition = null;
    this.target = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    }
  }

  listen() {
    try {
      this.recognition.start();
    } catch {
      // Already running; the next onend or error will restart it.
    }
  }

  // Browsers end recognition after silence or errors, so keep listening until the word is heard.
  scheduleRestart() {
    if (!this.recognition) return;
    this.restartTimer = setTimeout(() => this.listen(), RESTART_DELAY_MS);
  }

  handleResult(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      for (let k = 0; k < result.length; k++) {
        if (matchWord(result[k].transcript, this.target)) {
          this.finish();
          return;
        }
      }
    }
  }

  finish() {
    const onHeard = this.onHeard;
    this.stop();
    onHeard?.();
  }

  handleError(event) {
    const reason = FATAL_ERRORS[event.error];
    if (!reason) return;

    this.stop();
    this.onError?.(reason);
  }
}
