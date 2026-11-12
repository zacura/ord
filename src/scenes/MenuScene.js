import { Container, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../layout.js';
import { Button } from '../ui/Button.js';
import { DIFFICULTIES } from '../game/difficulty.js';

const SELECTED_COLOR = 0x2d6bd6;
const UNSELECTED_COLOR = 0x2a2f3a;
const DIFFICULTY_BUTTON_WIDTH = 104;
const DIFFICULTY_BUTTON_GAP = 6;

export class MenuScene {
  // onStart runs synchronously inside the Start tap, so the mic prompt counts as a user gesture.
  constructor({ difficulty, reducedMotion = false, onSelectDifficulty, onToggleReducedMotion, onStart }) {
    this.difficulty = difficulty;
    this.reducedMotion = reducedMotion;
    this.onSelectDifficulty = onSelectDifficulty;
    this.onToggleReducedMotion = onToggleReducedMotion;
    this.onStart = onStart;
    this.container = new Container();
    this.buildLayout();
  }

  selectDifficulty(id) {
    this.difficulty = id;
    this.onSelectDifficulty?.(id);
    this.rebuild();
  }

  toggleReducedMotion() {
    this.reducedMotion = !this.reducedMotion;
    this.onToggleReducedMotion?.(this.reducedMotion);
    this.rebuild();
  }

  rebuild() {
    this.container.removeChildren().forEach((child) => child.destroy({ children: true }));
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
    instructions.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.5);

    const rowWidth = DIFFICULTIES.length * DIFFICULTY_BUTTON_WIDTH + (DIFFICULTIES.length - 1) * DIFFICULTY_BUTTON_GAP;
    const difficultyButtons = DIFFICULTIES.map((entry, index) => {
      const button = new Button({
        label: entry.label,
        width: DIFFICULTY_BUTTON_WIDTH,
        height: 56,
        color: entry.id === this.difficulty ? SELECTED_COLOR : UNSELECTED_COLOR,
        onTap: () => this.selectDifficulty(entry.id),
      });
      button.position.set(
        (DESIGN_WIDTH - rowWidth) / 2 + index * (DIFFICULTY_BUTTON_WIDTH + DIFFICULTY_BUTTON_GAP),
        DESIGN_HEIGHT * 0.6,
      );
      return button;
    });

    const motion = new Button({
      label: `Reduce motion: ${this.reducedMotion ? 'On' : 'Off'}`,
      width: 260,
      height: 48,
      color: UNSELECTED_COLOR,
      onTap: () => this.toggleReducedMotion(),
    });
    motion.position.set((DESIGN_WIDTH - 260) / 2, DESIGN_HEIGHT * 0.7);

    const start = new Button({
      label: 'Start',
      width: 220,
      height: 64,
      onTap: () => this.onStart?.(this.difficulty),
    });
    start.position.set((DESIGN_WIDTH - 220) / 2, DESIGN_HEIGHT * 0.8);

    this.container.addChild(title, subtitle, instructions, ...difficultyButtons, motion, start);
  }
}
