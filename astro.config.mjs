import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://zapaguard.com',
  vite: {
    build: {
      // three.js core is ~520 kB minified and cannot be split further
      chunkSizeWarningLimit: 600,
    },
  },
});
