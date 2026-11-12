import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is required for microphone access on phones opening the LAN dev server.
// Relative asset URLs in builds let the static output run from a subpath (e.g. GitHub Pages project sites).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [basicSsl()],
}));
