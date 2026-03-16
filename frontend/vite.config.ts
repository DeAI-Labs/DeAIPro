import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Works because you have @types/node

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This solves the "Module not found: Can't resolve '@/lib/hooks'" error
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Use your Render URL here
        target: 'https://deai-kyzf.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist', // Vercel needs to know to look in 'dist'
    sourcemap: true,
  }
})