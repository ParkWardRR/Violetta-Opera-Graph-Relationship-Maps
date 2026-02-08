import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const dataDir = process.env.VITE_DATA_DIR ||
  path.join(process.env.HOME || '', 'Violetta-Opera-Graph-Relationship-Maps', 'data', 'processed')

// GitHub Pages deploys under /Violetta-Opera-Graph-Relationship-Maps/
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // In CI (GH Pages), use web/public/ which has graph.json committed.
  // Locally, use the external data directory.
  publicDir: process.env.CI ? path.resolve(__dirname, 'public') : dataDir,
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
    fs: {
      allow: [__dirname, path.resolve(__dirname, '..'), dataDir],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
