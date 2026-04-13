import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@erudis/shared': resolve(__dirname, 'packages/shared/src'),
    },
  },
});
