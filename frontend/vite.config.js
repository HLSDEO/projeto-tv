/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDocker = process.env.DOCKER_ENV === 'true';
const targetHost = isDocker ? 'http://backend:8000' : 'http://127.0.0.1:8000';
const targetWsHost = isDocker ? 'ws://backend:8000' : 'ws://127.0.0.1:8000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: isDocker ? '0.0.0.0' : 'localhost',
    port: 3100,
    allowedHosts: ['sdlog.local'],
    proxy: {
      '/api': {
        target: targetHost,
        changeOrigin: true,
      },
      '/uploads': {
        target: targetHost,
        changeOrigin: true,
      },
      '/ws': {
        target: targetWsHost,
        ws: true,
      },
    },
  },
})

