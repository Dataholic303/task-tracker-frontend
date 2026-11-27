import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://136.234.178.191',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // ДЛЯ АВАТАРОК
      '/users': {
        target: 'http://136.234.178.191',
        changeOrigin: true,
        secure: false,
      },
      // ДЛЯ SSE
      '/notifications': {
        target: 'http://136.234.178.191',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})