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
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
    },
  };
});
