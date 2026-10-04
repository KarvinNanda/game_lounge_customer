import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command, mode }) => {
  // Tanpa VITE_API_URL, axios diam-diam fallback ke localhost (src/api/index.js).
  // Gagalkan build production supaya kesalahan config terlihat, bukan lolos ke user.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && mode === 'production' && !env.VITE_API_URL) {
    throw new Error('VITE_API_URL wajib di-set untuk build production (build arg / env).')
  }

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5174,
    }
  }
})
