/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDocker = (env.DOCKER_ENV || process.env.DOCKER_ENV) === 'true';
  const backendHost = env.BACKEND_HOST || process.env.BACKEND_HOST || (isDocker ? 'backend:8000' : '127.0.0.1:8000');
  const targetHost = backendHost.startsWith('http') ? backendHost : `http://${backendHost}`;
  const targetWsHost = backendHost.startsWith('ws') ? backendHost : `ws://${backendHost.replace(/^https?:\/\//, '')}`;

  console.log(`[Vite Config] Proxying /api and /ws to: ${targetHost}`);

  return {
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
  };
})

