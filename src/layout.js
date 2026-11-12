import { Container } from 'pixi.js';

export const DESIGN_WIDTH = 360;
export const DESIGN_HEIGHT = 640;

// Reads env(safe-area-inset-*) as pixels; the values can change on rotation, so this is read on every fit.
function readSafeArea(element) {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  element.appendChild(probe);
  const style = getComputedStyle(probe);
  probe.remove();

  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

export function createWorld(app, observedElement) {
  const world = new Container();
  app.stage.addChild(world);

  const fit = () => {
    const { width, height } = app.screen;
    const safe = readSafeArea(observedElement);
    const availableWidth = width - safe.left - safe.right;
    const availableHeight = height - safe.top - safe.bottom;
    const scale = Math.min(availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT);

    world.scale.set(scale);
    world.position.set(
      safe.left + (availableWidth - DESIGN_WIDTH * scale) / 2,
      safe.top + (availableHeight - DESIGN_HEIGHT * scale) / 2,
    );
  };

  fit();
  new ResizeObserver(fit).observe(observedElement);

  return world;
}
