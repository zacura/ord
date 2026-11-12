import { Container, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../layout.js';
import { GameState } from '../game/Game.js';
import { WordLabel } from '../ui/WordLabel.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { MicIndicator, MIC_STATES } from '../ui/MicIndicator.js';
import { FeedbackFlash } from '../ui/FeedbackFlash.js';
import { Button } from '../ui/Button.js';

const BAR_WIDTH = 300;

export class PlayScene {
  constructor({ game, detector }) {
    this.game = game;
    this.detector = detector;
    this.container = new Container();

    this.score = this.text({ fontSize: 22, color: '#e6e8ee' }, DESIGN_HEIGHT * 0.08);
    this.status = this.text({ fontSize: 30, color: '#9aa3b2' }, DESIGN_HEIGHT * 0.4, 'Get ready…');
    this.wordLabel = new WordLabel({ maxWidth: DESIGN_WIDTH - 40 });
    this.wordLabel.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.4);

    this.bar = new ProgressBar({ width: BAR_WIDTH });
    this.bar.position.set((DESIGN_WIDTH - BAR_WIDTH) / 2, DESIGN_HEIGHT * 0.52);

    this.mic = new MicIndicator();
    this.mic.position.set(0, DESIGN_HEIGHT * 0.6);

    this.saidButton = new Button({
      label: 'I said it',
      width: 220,
      height: 64,
      color: 0x2e9d5b,
      onTap: () => this.detector.confirm(),
    });
    this.saidButton.position.set((DESIGN_WIDTH - 220) / 2, DESIGN_HEIGHT * 0.72);

    this.endButton = new Button({
      label: 'End',
      width: 160,
      height: 48,
      color: 0x4a4f5c,
      onTap: () => this.endSession(),
    });
    this.endButton.position.set((DESIGN_WIDTH - 160) / 2, DESIGN_HEIGHT * 0.88);

    this.flash = new FeedbackFlash({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT });

    this.container.addChild(
      this.wordLabel,
      this.bar,
      this.mic,
      this.saidButton,
      this.endButton,
      this.flash,
    );

    this.detector.onError = () => this.render();
    this.render();
  }

  text({ fontSize, color }, y, content = '') {
    const label = new Text({
      text: content,
      style: { fontFamily: GAME_FONT, fontWeight: '700', fontSize, fill: color },
    });
    label.anchor.set(0.5);
    label.position.set(DESIGN_WIDTH / 2, y);
    this.container.addChild(label);
    return label;
  }

  // Called by main.js on every Game state change.
  handleState(state) {
    if (state === GameState.PLAYING) this.wordLabel.show(this.game.word.word);
    if (state === GameState.FEEDBACK) this.flash.play(this.game.lastResult.outcome);
    this.render();
  }

  render() {
    const state = this.game.state;
    const playing = state === GameState.PLAYING;
    const resolved = state === GameState.FEEDBACK;

    this.score.text = `Heard: ${this.game.score}`;
    this.status.visible = state === GameState.COUNTDOWN;
    this.wordLabel.visible = playing || resolved;
    this.bar.visible = playing;
    this.saidButton.visible = playing && this.detector.mode === 'self-report';
    this.endButton.visible = playing || resolved;

    this.mic.visible = playing || (resolved && this.game.lastResult.outcome === 'heard');
    if (resolved) {
      this.mic.setState(MIC_STATES.HEARD);
    } else if (this.detector.mode === 'self-report') {
      this.mic.setState(MIC_STATES.ERROR);
    } else {
      this.mic.setState(MIC_STATES.LISTENING);
    }
    this.mic.x = (DESIGN_WIDTH - this.mic.width) / 2;
  }

  endSession() {
    if (this.game.state === GameState.PLAYING || this.game.state === GameState.FEEDBACK) {
      this.game.end();
    }
  }

  update(deltaMS) {
    if (this.game.state === GameState.PLAYING) {
      this.bar.setProgress(this.game.timer.progress);
    }
    this.wordLabel.update(deltaMS);
    this.mic.update(deltaMS);
    this.flash.update(deltaMS);
  }

  destroy() {
    this.detector.onError = null;
  }
}
