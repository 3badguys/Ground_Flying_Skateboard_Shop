import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    base: env.VITE_BASE || '/',
    server: {
      port: 5173,
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
      hmr: false,
      proxy: {
        '^/api/': {
          target: process.env.VITE_API_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
