import { Container } from 'pixi.js';

export const DESIGN_WIDTH = 360;
export const DESIGN_HEIGHT = 640;

export function createWorld(app, observedElement) {
  const world = new Container();
  app.stage.addChild(world);

  const fit = () => {
    const { width, height } = app.screen;
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);

    world.scale.set(scale);
    world.position.set(
      (width - DESIGN_WIDTH * scale) / 2,
      (height - DESIGN_HEIGHT * scale) / 2,
    );
  };

  fit();
  new ResizeObserver(fit).observe(observedElement);

  return world;
}
