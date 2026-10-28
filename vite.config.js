import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

process.env.RUST_BACKTRACE = '1'
process.env.RAYON_NUM_THREADS = process.env.RAYON_NUM_THREADS || '1'
process.env.ROLLDOWN_WORKERS = '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    minify: false,
    cssMinify: false,
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
