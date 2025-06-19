// vite.config.mjs
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    middlewareMode: true,
    host: true,
    allowedHosts: [
      'pwaurora.com.br',
      'www.pwaurora.com.br',
    ],

  },
  appType: 'custom',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
