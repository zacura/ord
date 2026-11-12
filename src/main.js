import { Application } from 'pixi.js';
import './style.css';
import { loadFonts } from './fonts.js';
import { createWorld } from './layout.js';
import { SceneManager } from './scenes/SceneManager.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { Game, GameState } from './game/Game.js';
import { WORDS } from './data/words.js';
import { createSpeechDetector } from './speech/createSpeechDetector.js';

async function start() {
  await loadFonts();

  const gameElement = document.querySelector('#game');
  const app = new Application();

  await app.init({
    canvas: document.querySelector('#game-canvas'),
    resizeTo: gameElement,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    background: '#111318',
  });

  const world = createWorld(app, gameElement);
  const scenes = new SceneManager(world);

  const detector = createSpeechDetector();
  const game = new Game({
    words: WORDS,
    detector,
    onStateChange: (state) => {
      if (state === GameState.COUNTDOWN) {
        scenes.show(new PlayScene({ game, detector }));
      } else if (state === GameState.RESULTS) {
        scenes.show(new ResultScene({ results: game.results, onPlayAgain: () => game.playAgain() }));
      } else {
        scenes.current?.handleState?.(state);
      }
    },
  });

  scenes.show(
    new MenuScene({
      onStart: () => {
        detector.prepare();
        game.start();
      },
    }),
  );

  app.ticker.add(({ deltaMS }) => {
    game.update(deltaMS);
    scenes.update(deltaMS);
  });

  return { app, scenes };
}

start();
