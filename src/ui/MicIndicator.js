import { Container, Graphics, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';

export const MIC_STATES = Object.freeze({
  LISTENING: 'listening',
  HEARD: 'heard',
  ERROR: 'error',
  LOADING: 'loading',
});

const STATE_STYLE = {
  [MIC_STATES.LISTENING]: { color: 0x4fc3f7, text: 'Listening…' },
  [MIC_STATES.HEARD]: { color: 0x4caf50, text: 'Heard it!' },
  [MIC_STATES.ERROR]: { color: 0xf44336, text: 'Mic unavailable' },
  [MIC_STATES.LOADING]: { color: 0xffb300, text: 'Loading voice model…' },
};

const DOT_RADIUS = 9;
const PULSE_MS = 900;

export class MicIndicator extends Container {
  constructor({ fontSize = 20, reducedMotion = false } = {}) {
    super();
    this.state = null;
    this.reducedMotion = reducedMotion;
    this.pulseElapsed = 0;

    this.dot = new Graphics();
    this.label = new Text({
      text: '',
      style: { fontFamily: GAME_FONT, fontWeight: '700', fontSize, fill: '#e6e8ee' },
    });
    this.label.anchor.set(0, 0.5);
    this.label.x = DOT_RADIUS * 2 + 10;
    this.addChild(this.dot, this.label);

    this.setState(MIC_STATES.LISTENING);
  }

  setState(state) {
    const style = STATE_STYLE[state];
    if (!style) throw new Error(`Unknown mic state: ${state}`);

    this.state = state;
    this.pulseElapsed = 0;
    this.label.text = style.text;
    this.label.style.fill = style.color;
    this.drawDot(style.color, 1);
  }

  update(deltaMS) {
    if (this.state !== MIC_STATES.LISTENING || this.reducedMotion) return;

    this.pulseElapsed = (this.pulseElapsed + deltaMS) % PULSE_MS;
    const phase = Math.sin((this.pulseElapsed / PULSE_MS) * Math.PI * 2);
    this.drawDot(STATE_STYLE[this.state].color, 0.6 + 0.4 * (phase + 1) / 2);
  }

  drawDot(color, alpha) {
    this.dot.clear();
    this.dot.circle(DOT_RADIUS, 0, DOT_RADIUS).fill({ color, alpha });
  }
}
