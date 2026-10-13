import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const victoryPresentation = mode === 'android' ? 'android' : 'web';

  return {
    publicDir: 'public',
    build: {
      rollupOptions: { output: { manualChunks(id) {
        if (id.includes('/node_modules/@firebase/auth/') || id.includes('/node_modules/firebase/auth/')) return 'firebase-auth';
        if (id.includes('/node_modules/@firebase/firestore/') || id.includes('/node_modules/firebase/firestore/')) return 'firebase-firestore';
        if (id.includes('/node_modules/@firebase/analytics/') || id.includes('/node_modules/firebase/analytics/')) return 'firebase-analytics';
        if (id.includes('/node_modules/@firebase/') || id.includes('/node_modules/firebase/')) return 'firebase-core';
        if (id.endsWith('/js/generated/themeAssetManifest.js')) return 'theme-manifest';
      } } },
    },
    resolve: {
      alias: {
        'victory-presentation': fileURLToPath(
          new URL(`./js/victoryPresentation.${victoryPresentation}.js`, import.meta.url),
        ),
      },
    },
    server: {
      // Opt-in UI runs need a stable module graph while other tasks update assets.
      hmr: process.env.GAME_SHELL_TEST_PORT ? false : undefined,
      watch: process.env.GAME_SHELL_TEST_PORT ? null : undefined,
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
    },
  };
});
