import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// The FastAPI backend. Requests go to /api and /uploads so the browser sees a
// single origin in dev and preview: no CORS, and relative photo URLs work.
const backend = 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
      '/uploads': { target: backend, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
      '/uploads': { target: backend, changeOrigin: true },
    },
  },
})
