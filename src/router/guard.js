import { START_LOCATION } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

/**
 * Halaman ber-meta requiresAuth untuk guest:
 * - navigasi di dalam app → tampilkan LoginPromptModal, tetap di halaman sekarang
 * - load pertama lewat URL (link dibagikan, kembali dari payment gateway dengan sesi habis)
 *   → ke /login?redirect=…, karena belum ada halaman/layout untuk menampilkan modal
 */
export const authGuard = (to, from) => {
  if (!to.meta.requiresAuth) return true
  const authStore = useAuthStore()
  if (authStore.isLoggedIn) return true
  if (from === START_LOCATION) return { path: '/login', query: { redirect: to.fullPath } }
  authStore.openAuthModal(to.fullPath) // simpan intended path, buka modal
  return false
}
