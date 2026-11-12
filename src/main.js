import { Application } from 'pixi.js';
import './style.css';
import { loadFonts } from './fonts.js';
import { createWorld } from './layout.js';
import { SceneManager } from './scenes/SceneManager.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { Game, GameState } from './game/Game.js';
import { loadStats, saveStats, recordResults, missWeight } from './game/stats.js';
import { loadDifficulty, saveDifficulty, wordsForDifficulty } from './game/difficulty.js';
import { loadReducedMotion, saveReducedMotion } from './game/motion.js';
import { WORDS } from './data/words.js';
import { createSpeechDetector } from './speech/createSpeechDetector.js';
import { releaseMicStream } from './speech/micStream.js';
import { unlockAudio } from './speech/audioCapture.js';

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
  // Runs synchronously inside the Start / Play again tap, so the mic prompt and audio unlock are allowed.
  const beginRound = () => {
    detector.prepare();
    unlockAudio();
  };

  let stats = loadStats();
  let reducedMotion = loadReducedMotion();
  const game = new Game({
    words: WORDS,
    detector,
    weightOf: (entry) => missWeight(stats, entry.word),
    onStateChange: (state) => {
      if (state === GameState.COUNTDOWN) {
        scenes.show(new PlayScene({ game, detector, reducedMotion }));
      } else if (state === GameState.RESULTS) {
        releaseMicStream();
        stats = recordResults(stats, game.results);
        saveStats(stats);
        scenes.show(
          new ResultScene({
            results: game.results,
            bestScore: stats.bestScore,
            onPlayAgain: () => {
              beginRound();
              game.playAgain();
            },
          }),
        );
      } else {
        scenes.current?.handleState?.(state);
      }
    },
  });

  scenes.show(
    new MenuScene({
      difficulty: loadDifficulty(),
      reducedMotion,
      onSelectDifficulty: (id) => saveDifficulty(id),
      onToggleReducedMotion: (enabled) => {
        reducedMotion = enabled;
        saveReducedMotion(enabled);
      },
      onStart: (id) => {
        beginRound();
        game.start(wordsForDifficulty(WORDS, id));
      },
    }),
  );

  app.ticker.add(({ deltaMS }) => {
    game.update(deltaMS);
    scenes.update(deltaMS);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseMicStream();
  });

  return { app, scenes };
}

start();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
