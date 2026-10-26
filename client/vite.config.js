import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  '/api': 'http://localhost:5000',
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Skip the CSS pipeline in tests; components are checked by role and text, not styles.
    css: false,
    // Node 25+ ships an experimental Web Storage that hides jsdom's localStorage (and warns); switch it off in tests.
    poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } },
  },
});
