import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCustomerMe } from '@/api/authApi'
import { safeJsonParse } from '@/utils/security'

// ── Cookie-based auth (httpOnly) ────────────────────────────────────
// Token disimpan backend di cookie httpOnly — frontend tidak pernah
// melihatnya. State login ditentukan dari keberadaan data customer,
// dan divalidasi ulang ke server via fetchMe() saat app boot.
export const useAuthStore = defineStore('customerAuth', () => {
  // Migrasi: bersihkan token lama era localStorage (tidak dipakai lagi)
  localStorage.removeItem('customer_token')

  // safeJsonParse: data localStorage bisa korup/dimanipulasi — jangan sampai crash saat boot
  const customer = ref(safeJsonParse(localStorage.getItem('customer_data'), null))

  const isLoggedIn = computed(() => !!customer.value)
  const isMember   = computed(() => customer.value?.type === 'member')

  const setAuth = (customerData) => {
    customer.value = customerData
    localStorage.setItem('customer_data', JSON.stringify(customerData))
  }

  const logout = () => {
    customer.value = null
    localStorage.removeItem('customer_data')
  }

  // Validasi sesi ke server — cookie dilampirkan otomatis oleh browser.
  // 401 → cookie invalid/expired → state lokal dibersihkan.
  const fetchMe = async () => {
    if (!customer.value) return
    try {
      const { data } = await getCustomerMe()
      customer.value = data.data
      localStorage.setItem('customer_data', JSON.stringify(data.data))
    } catch { logout() }
  }

  // ── Auth Modal (show LoginPromptModal alih-alih hard-redirect) ──
  const showAuthModal = ref(false)
  const pendingPath   = ref('')   // path yang ingin dituju sebelum modal muncul

  const openAuthModal = (intendedPath = '') => {
    pendingPath.value   = intendedPath
    showAuthModal.value = true
  }

  return { customer, isLoggedIn, isMember, setAuth, logout, fetchMe,
           showAuthModal, pendingPath, openAuthModal }
})
