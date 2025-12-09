import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [vue(), wasm()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 2347,
    open: false
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  worker: {
    format: 'es',
    plugins: () => [wasm()]
  }
})

