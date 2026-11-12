export const MOTION_KEY = 'ord.reducedMotion';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

// A saved choice wins; otherwise follow the operating system's reduced-motion preference.
export function loadReducedMotion(storage = globalThis.localStorage, env = globalThis) {
  try {
    const stored = storage?.getItem(MOTION_KEY);
    if (stored === 'true' || stored === 'false') return stored === 'true';
  } catch {
    // Storage unavailable; fall through to the system preference.
  }
  return env.matchMedia?.(REDUCE_QUERY).matches ?? false;
}

export function saveReducedMotion(enabled, storage = globalThis.localStorage) {
  try {
    storage?.setItem(MOTION_KEY, String(enabled));
  } catch {
    // Storage may be unavailable; the choice just won't persist.
  }
}
