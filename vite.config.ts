/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  test: {
    // The solver suites run hundreds of scrambles; give them room on slower machines.
    testTimeout: 30000,
  },
  build: {
    // three.js ships in the lazily loaded CubeScene chunk; its size is expected.
    chunkSizeWarningLimit: 1000,
  },
})
