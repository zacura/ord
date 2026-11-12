import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is required for microphone access on phones opening the LAN dev server.
export default defineConfig({
  plugins: [basicSsl()],
});
