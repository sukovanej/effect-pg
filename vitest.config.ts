import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/setupTests.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      'effect-pg': path.resolve(__dirname, '/src'),
    },
  },
});
