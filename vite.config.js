import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages phục vụ project tại /MemoryMatchV1.1a/, không phải domain gốc.
  base: '/MemoryMatchV1.1a/',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
});
