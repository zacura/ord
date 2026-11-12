import { SpeechDetector } from './SpeechDetector.js';

// Used when speech recognition is unavailable or the mic is denied: the player taps "I said it".
export class SelfReportDetector extends SpeechDetector {
  constructor() {
    super();
    this.target = null;
  }

  start(target) {
    this.target = target;
  }

  stop() {
    this.target = null;
  }

  confirm() {
    if (!this.target) return;
    const onHeard = this.onHeard;
    this.stop();
    onHeard?.();
  }
}
