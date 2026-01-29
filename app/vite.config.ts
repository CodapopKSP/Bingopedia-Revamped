import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/leaderboard': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api/games': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // @ts-expect-error - Vitest config is valid but TypeScript doesn't recognize it without vitest/config import
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
