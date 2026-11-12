import '@fontsource/nunito/700.css';

export const GAME_FONT = 'Nunito';

export async function loadFonts() {
  try {
    await document.fonts.load(`700 48px ${GAME_FONT}`);
  } catch {
    // Fall back to the system font if the web font cannot be fetched.
  }
}
