import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'

  return {
    plugins: [vue()],
    base,
    server: {
      port: 5173,
      allowedHosts: (env.ALLOWED_HOSTS || '.ngrok-free.dev,.ngrok-free.app').split(','),
      hmr: false,
      watch: { usePolling: true },
      proxy: base !== '/'
        ? {
            [`${base}api/`]: {
              target: process.env.VITE_API_TARGET || 'http://localhost:3000',
              changeOrigin: true,
              rewrite: (path) => path.replace(new RegExp(`^${base}api`), '/api'),
            },
          }
        : {
            '/api/': {
              target: process.env.VITE_API_TARGET || 'http://localhost:3000',
              changeOrigin: true,
            },
          },
    },
  }
})
