import { SpeechDetector } from './SpeechDetector.js';
import { RecognitionDetector } from './recognition.js';
import { SelfReportDetector } from './selfReport.js';
import { requestMicrophone } from './micPermission.js';

// Picks speech recognition when the browser supports it, and switches to the "I said it" button
// for the rest of the session if the mic is denied or recognition is unavailable.
export class AutoSpeechDetector extends SpeechDetector {
  constructor({
    recognition = RecognitionDetector.isSupported() ? new RecognitionDetector() : null,
    selfReport = new SelfReportDetector(),
  } = {}) {
    super();
    this.recognition = recognition;
    this.selfReport = selfReport;
    this.active = null;
    this.target = null;

    this.selfReport.onHeard = () => this.handleHeard();
    if (this.recognition) {
      this.recognition.onHeard = () => this.handleHeard();
      this.recognition.onError = (reason) => this.fallBack(reason);
    }
  }

  get mode() {
    return this.recognition ? 'recognition' : 'self-report';
  }

  async prepare() {
    if (!this.recognition) return;

    const result = await requestMicrophone();
    if (result !== 'granted') this.fallBack(result);
  }

  start(target) {
    this.stop();
    this.target = target;
    this.active = this.recognition ?? this.selfReport;
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

export function createSpeechDetector() {
  return new AutoSpeechDetector();
}
