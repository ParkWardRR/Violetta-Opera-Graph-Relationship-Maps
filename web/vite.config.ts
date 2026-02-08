import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const dataDir = process.env.VITE_DATA_DIR ||
  path.join(process.env.HOME || '', 'Violetta-Opera-Graph-Relationship-Maps', 'data', 'processed')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: dataDir,
  server: {
    port: 5173,
    fs: {
      allow: [__dirname, path.resolve(__dirname, '..'), dataDir],
    },
  },
})
