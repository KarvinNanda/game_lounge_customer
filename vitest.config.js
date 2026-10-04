import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // Nilai tetap supaya test tidak bergantung pada file .env lokal
    env: {
      VITE_API_URL: 'http://localhost:8080/api',
    },
    css: false, // skip CSS processing — not needed for unit tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'src/test/**',
        'src/assets/**',
        'src/main.js',
        'src/__tests__/**',
      ],
    },
  },
})
