import { defineConfig, mergeConfig } from 'vite';
import appConfig from '../../../vite.config.js';

export default defineConfig(mergeConfig(appConfig({ mode: 'production' }), {
  build: { outDir: 'runtime/qa/animated-backgrounds/pilot-dist', emptyOutDir: true,
    rollupOptions: { input: { app: 'index.html', pilot: 'docs/design/animated-backgrounds/pilot.html' } } },
}));
