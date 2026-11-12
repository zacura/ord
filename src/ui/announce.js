export const STATUS_ELEMENT_ID = 'game-status';

// Mirrors game text into the aria-live region in index.html for screen readers.
export function announce(message, doc = globalThis.document) {
  const region = doc?.getElementById(STATUS_ELEMENT_ID);
  if (region) region.textContent = message;
}
