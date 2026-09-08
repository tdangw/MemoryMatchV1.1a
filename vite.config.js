import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const victoryPresentation = mode === 'android' ? 'android' : 'web';

  return {
    publicDir: 'public',
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
