import { WordQueue } from './WordQueue.js';
import { Timer, WORD_TIME_MS } from './Timer.js';

export const COUNTDOWN_MS = 3000;
export const FEEDBACK_MS = 600;

export const GameState = Object.freeze({
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  FEEDBACK: 'feedback',
  RESULTS: 'results',
});

const TRANSITIONS = {
  [GameState.MENU]: [GameState.COUNTDOWN],
  [GameState.COUNTDOWN]: [GameState.PLAYING],
  [GameState.PLAYING]: [GameState.FEEDBACK, GameState.RESULTS],
  [GameState.FEEDBACK]: [GameState.PLAYING, GameState.RESULTS],
  [GameState.RESULTS]: [GameState.COUNTDOWN],
};

export class Game {
  constructor({ words, detector, onStateChange = null, random = Math.random }) {
    this.words = words;
    this.detector = detector;
    this.random = random;
    this.onStateChange = onStateChange;
    this.queue = null;
    this.word = null;
    this.lastResult = null;
    this.results = [];
    this.state = GameState.MENU;
    this.delayRemaining = 0;
    this.paused = false;
    this.timer = new Timer(WORD_TIME_MS, { onExpire: () => this.resolve('missed') });
    this.handleVisibility = () => (globalThis.document?.hidden ? this.pause() : this.resume());
  }

  start() {
    this.queue = new WordQueue(this.words, this.random);
    this.results = [];
    this.lastResult = null;
    globalThis.document?.addEventListener('visibilitychange', this.handleVisibility);
    this.go(GameState.COUNTDOWN);
  }

  pause() {
    if (this.state !== GameState.PLAYING || this.paused) return;

    this.paused = true;
    this.timer.pause();
    this.detector.stop();
  }

  resume() {
    if (!this.paused) return;

    this.paused = false;
    if (this.state === GameState.PLAYING) {
      this.timer.resume();
      this.detector.onHeard = () => this.resolve('heard');
      this.detector.start(this.word.word);
    }
  }

  end() {
    this.go(GameState.RESULTS);
  }

  playAgain() {
    this.go(GameState.COUNTDOWN);
  }

  update(deltaMS) {
    if (this.state === GameState.PLAYING) {
      this.timer.update(deltaMS);
      return;
    }

    if (this.state === GameState.COUNTDOWN || this.state === GameState.FEEDBACK) {
      this.delayRemaining -= deltaMS;
      if (this.delayRemaining <= 0) this.go(GameState.PLAYING);
    }
  }

  // Ends the current word as 'heard' or 'missed'; ignored unless a word is being played.
  resolve(outcome) {
    if (this.state !== GameState.PLAYING) return;

    this.timer.stop();
    this.detector.stop();
    this.lastResult = { word: this.word, outcome, timeMS: this.timer.elapsed };
    this.results.push(this.lastResult);
    this.go(GameState.FEEDBACK);
  }

  get score() {
    return this.results.filter((result) => result.outcome === 'heard').length;
  }

  // The list is endless: when every word has been shown, a new shuffled pass begins.
  nextWord() {
    if (!this.queue || this.queue.isDone()) {
      this.queue = new WordQueue(this.words, this.random);
    }
    return this.queue.next();
  }

  go(to) {
    if (!TRANSITIONS[this.state].includes(to)) {
      throw new Error(`Invalid game transition: ${this.state} → ${to}`);
    }

    this.state = to;
    if (to === GameState.COUNTDOWN) this.delayRemaining = COUNTDOWN_MS;
    if (to === GameState.FEEDBACK) this.delayRemaining = FEEDBACK_MS;
    if (to === GameState.PLAYING) this.beginWord();
    if (to === GameState.RESULTS) {
      this.paused = false;
      this.timer.stop();
      this.detector.stop();
      globalThis.document?.removeEventListener('visibilitychange', this.handleVisibility);
    }
    this.onStateChange?.(to);
  }

  beginWord() {
    this.word = this.nextWord();
    this.timer.start();
    this.detector.onHeard = () => this.resolve('heard');
    this.detector.start(this.word.word);
  }
}
