import { Container, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../layout.js';
import { Button } from '../ui/Button.js';

export class MenuScene {
  // onStart runs synchronously inside the Start tap, so the mic prompt counts as a user gesture.
  constructor({ onStart }) {
    this.onStart = onStart;
    this.container = new Container();
    this.buildLayout();
  }

  buildLayout() {
    const title = new Text({
      text: 'Ord',
      style: { fontFamily: GAME_FONT, fontWeight: '700', fontSize: 96, fill: '#f5f5f5' },
    });
    title.anchor.set(0.5);
    title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.3);

    const subtitle = new Text({
      text: 'Learn to read Swedish',
      style: { fontFamily: GAME_FONT, fontWeight: '700', fontSize: 22, fill: '#9aa3b2' },
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.3 + 70);

    const instructions = new Text({
      text: 'Read each word aloud before the bar runs out.',
      style: {
        fontFamily: GAME_FONT,
        fontWeight: '700',
        fontSize: 18,
        fill: '#9aa3b2',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: DESIGN_WIDTH - 60,
      },
    });
    instructions.anchor.set(0.5);
    instructions.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.55);

    const start = new Button({
      label: 'Start',
      width: 220,
      height: 64,
      onTap: () => this.onStart?.(),
    });
    start.position.set((DESIGN_WIDTH - 220) / 2, DESIGN_HEIGHT * 0.7);

    this.container.addChild(title, subtitle, instructions, start);
  }
}
