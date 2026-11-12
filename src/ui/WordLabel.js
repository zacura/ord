import { Container, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';

const POP_MS = 260;
const POP_START_SCALE = 0.6;

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export class WordLabel extends Container {
  constructor({ maxWidth, fontSize = 88, reducedMotion = false }) {
    super();
    this.maxWidth = maxWidth;
    this.reducedMotion = reducedMotion;
    this.fitScale = 1;
    this.popElapsed = POP_MS;

    this.label = new Text({
      text: '',
      style: { fontFamily: GAME_FONT, fontWeight: '700', fontSize, fill: '#f5f5f5' },
    });
    this.label.anchor.set(0.5);
    this.addChild(this.label);
  }

  // Shows a new word, shrinks it to fit the width and restarts the pop-in animation.
  show(word) {
    this.label.text = word;
    this.label.scale.set(1);
    this.fitScale = Math.min(1, this.maxWidth / this.label.width);
    this.popElapsed = this.reducedMotion ? POP_MS : 0;
    this.applyScale(this.reducedMotion ? 1 : POP_START_SCALE);
  }

  update(deltaMS) {
    if (this.popElapsed >= POP_MS) return;

    this.popElapsed = Math.min(POP_MS, this.popElapsed + deltaMS);
    this.applyScale(POP_START_SCALE + (1 - POP_START_SCALE) * easeOutBack(this.popElapsed / POP_MS));
  }

  applyScale(factor) {
    this.label.scale.set(this.fitScale * factor);
  }
}
