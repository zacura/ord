import { Application } from 'pixi.js';
import './style.css';
import { loadFonts } from './fonts.js';
import { createWorld } from './layout.js';
import { SceneManager } from './scenes/SceneManager.js';

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

  app.ticker.add(({ deltaMS }) => scenes.update(deltaMS));

  return { app, scenes };
}

start();
