import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@d3chart': path.resolve(__dirname, '../d3-chart'),
    },
  },
  server: {
    open: true,
    port: 5173
  }
}); 