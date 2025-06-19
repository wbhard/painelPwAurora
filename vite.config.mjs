// vite.config.mjs
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    middlewareMode: true,
  },
  appType: 'custom',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
