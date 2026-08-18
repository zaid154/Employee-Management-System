import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API runs on 5002 in dev; proxy /api so the client can use relative URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
});
