import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Vite's SPA fallback answers missing files with index.html (200). transformers.js
// probes optional model configs such as processor_config.json and needs a 404 instead.
const modelsNotFound = {
  name: 'models-not-found',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = req.url.split('?')[0];
      if (!path.startsWith('/models/')) return next();
      if (existsSync(fileURLToPath(new URL(`./public${decodeURIComponent(path)}`, import.meta.url)))) return next();
      res.statusCode = 404;
      res.end();
    });
  },
};

// HTTPS is required for microphone access on phones opening the LAN dev server.
// Relative asset URLs in builds let the static output run from a subpath (e.g. GitHub Pages project sites).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [basicSsl(), modelsNotFound],
}));
