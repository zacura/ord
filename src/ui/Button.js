import { Container, Graphics, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';

export class Button extends Container {
  constructor({ label, width = 220, height = 64, color = 0x3f7cff, onTap }) {
    super();
    this.buttonWidth = width;
    this.buttonHeight = height;
    this.color = color;
    this.onTap = onTap;

    this.background = new Graphics();
    this.caption = new Text({
      text: label,
      style: { fontFamily: GAME_FONT, fontWeight: '700', fontSize: 26, fill: '#ffffff' },
    });
    this.caption.anchor.set(0.5);
    this.caption.position.set(width / 2, height / 2);

    this.draw(color);
    this.addChild(this.background, this.caption);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => this.draw(color, 0.85));
    this.on('pointerout', () => this.draw(color));
    this.on('pointertap', () => this.onTap?.());
  }

  draw(color, alpha = 1) {
    this.background.clear();
    this.background.roundRect(0, 0, this.buttonWidth, this.buttonHeight, 16).fill({ color, alpha });
  }
}
