import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_API_BASE_URL is a build-time env var.
// Set it in your .env file or pass it as a build arg:
//   VITE_API_BASE_URL=http://localhost:8000
// It defaults to http://localhost:8000 in App.tsx when not set.

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
