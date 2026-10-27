import { defineConfig, mergeConfig } from 'vite';
import appConfig from '../../../vite.config.js';
export default defineConfig(mergeConfig(appConfig({ mode: 'production' }), {
  build: { outDir: 'runtime/qa/animated-backgrounds/production', emptyOutDir: true,
    rollupOptions: { input: { app: 'index.html', 'ambient-probe': 'docs/design/animated-backgrounds/probe-entry.js' },
      output: { entryFileNames: chunk => chunk.name === 'ambient-probe' ? 'ambient-probe.js' : 'assets/[name]-[hash].js' } } },
}));
