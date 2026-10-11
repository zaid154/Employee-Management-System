import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      strict: false,
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        '..',
        'C:/Users/user/Desktop/All-Pojects',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
});
