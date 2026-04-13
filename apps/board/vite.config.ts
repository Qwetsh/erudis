import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const isGHPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isGHPages ? '/erudis/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@erudis/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 5173,
  },
});
