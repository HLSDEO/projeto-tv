import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3100,
    proxy: {
      '/api': {
        target: 'http://backend:8100',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://backend:8100',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:8100',
        ws: true,
      },
    },
  },
})
