// Common interface for every way of detecting that the player said the word.
// Implementations call onHeard() once per start() and onError(reason) when they cannot continue,
// with reason 'denied' or 'unavailable'.
export class SpeechDetector {
  constructor() {
    this.onHeard = null;
    this.onError = null;
  }

  start(_target) {
    throw new Error('SpeechDetector.start() must be implemented');
  }

  stop() {}
}
