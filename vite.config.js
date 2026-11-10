import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

function offlineShellBundle(){
  return {name:'offline-shell-bundle',apply:'build',async writeBundle(options,bundle){
    const files=Object.keys(bundle).filter(path=>/\.(?:js|css)$/.test(path)).sort();
    const buildId=createHash('sha256').update(files.join('\n')).digest('hex').slice(0,16);
    const shell=['./','./index.html','./manifest.webmanifest','./icons/memory-match-icon.svg',...files.map(path=>`./${path}`)];
    const source=(await readFile('public/sw.js','utf8')).replace('memory-match-shell-v3',`memory-match-shell-${buildId}`)
      .replace(/const APP_SHELL = \[[\s\S]*?\];/,`const APP_SHELL = ${JSON.stringify(shell)};`);
    const directory=resolve(options.dir||'dist');
    await writeFile(resolve(directory,'sw.js'),source);
    await writeFile(resolve(directory,'offline-shell.json'),JSON.stringify({version:1,buildId,files},null,2));
  }};
}

// Local media previews must not reuse Chrome's disk-cached partial responses.
// Keep byte ranges enabled and leave deployed asset/offline caching unchanged.
function configureLocalAudioCache(server) {
  server.middlewares.use((request, response, next) => {
    if (/(?:^|\/)assets\/sounds\/[^?]+\.(?:mp3|ogg|wav|m4a)(?:\?|$)/i.test(request.url || '')) {
      response.setHeader('Cache-Control', 'no-store');
    }
    next();
  });
}

export default defineConfig(({ mode }) => {
  const victoryPresentation = mode === 'android' ? 'android' : 'web';

  return {
    publicDir: 'public',
    plugins: [offlineShellBundle(),{
      name: 'local-audio-cache-policy',
      configureServer: configureLocalAudioCache,
      configurePreviewServer: configureLocalAudioCache,
    }],
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
