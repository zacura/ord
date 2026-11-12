import { Container, Text } from 'pixi.js';
import { GAME_FONT } from '../fonts.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../layout.js';
import { Button } from '../ui/Button.js';
import { announce } from '../ui/announce.js';

export const MAX_LISTED_MISSES = 10;

function summarize(results) {
  const heard = results.filter((result) => result.outcome === 'heard').length;
  const missed = results.filter((result) => result.outcome === 'missed').map((result) => result.word);
  return { heard, missed };
}

export class ResultScene {
  // results are the entries from Game.results; bestScore is the best 'heard' count across sessions.
  constructor({ results, bestScore = 0, onPlayAgain }) {
    this.onPlayAgain = onPlayAgain;
    this.container = new Container();
    const summary = summarize(results);
    this.buildLayout(summary, bestScore);
    announce(`Session finished. Heard ${summary.heard}, missed ${summary.missed.length}.`);
  }

  buildLayout({ heard, missed }, bestScore) {
    const centerX = DESIGN_WIDTH / 2;
    const style = (fontSize, fill) => ({
      fontFamily: GAME_FONT,
      fontWeight: '700',
      fontSize,
      fill,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: DESIGN_WIDTH - 60,
    });

    const title = new Text({ text: 'Results', style: style(44, '#f5f5f5') });
    title.anchor.set(0.5);
    title.position.set(centerX, DESIGN_HEIGHT * 0.12);

    const score = new Text({
      text: `Heard: ${heard}   Missed: ${missed.length}`,
      style: style(26, '#e6e8ee'),
    });
    score.anchor.set(0.5);
    score.position.set(centerX, DESIGN_HEIGHT * 0.25);

    const best = new Text({ text: `Best: ${bestScore}`, style: style(20, '#9aa3b2') });
    best.anchor.set(0.5);
    best.position.set(centerX, DESIGN_HEIGHT * 0.3);

    const missedTitle = new Text({
      text: missed.length ? 'Missed words' : 'No missed words – well done!',
      style: style(20, '#9aa3b2'),
    });
    missedTitle.anchor.set(0.5);
    missedTitle.position.set(centerX, DESIGN_HEIGHT * 0.35);

    const listed = missed.slice(0, MAX_LISTED_MISSES);
    const extra = missed.length - listed.length;
    const lines = listed.map((entry) => (entry.hint ? `${entry.word} – ${entry.hint}` : entry.word));
    if (extra > 0) lines.push(`and ${extra} more`);

    const list = new Text({ text: lines.join('\n'), style: style(22, '#f5f5f5') });
    list.anchor.set(0.5, 0);
    list.position.set(centerX, DESIGN_HEIGHT * 0.42);

    const playAgain = new Button({
      label: 'Play again',
      width: 220,
      height: 64,
      onTap: () => this.onPlayAgain?.(),
    });
    playAgain.position.set((DESIGN_WIDTH - 220) / 2, DESIGN_HEIGHT * 0.8);

    this.container.addChild(title, score, best, missedTitle, list, playAgain);
  }
}
