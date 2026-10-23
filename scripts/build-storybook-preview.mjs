import { build } from 'vite';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
// Compile the real app and the opt-in presentation module without wiring a
// development entry into the shipped game before the D2 golden is approved.
await build({ root, configFile: path.join(root, 'vite.config.js'),
  define: { 'import.meta.env.VITE_FIREBASE_DISABLED': JSON.stringify('1') },
  build: { outDir: path.join(root, 'docs/design/achievements/runtime/compiled'),
    emptyOutDir: false,
    rollupOptions: { input: { app: path.join(root, 'index.html'), storybook: path.join(root, 'js/storybook/presentation.js') },
      preserveEntrySignatures: 'exports-only' },
  },
});
