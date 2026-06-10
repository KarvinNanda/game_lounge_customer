import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCustomerMe } from '@/api/authApi'

export const useAuthStore = defineStore('customerAuth', () => {
  const token    = ref(localStorage.getItem('customer_token') || '')
  const customer = ref(JSON.parse(localStorage.getItem('customer_data') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isMember   = computed(() => customer.value?.type === 'member')

  const setAuth = (newToken, customerData) => {
    token.value    = newToken
    customer.value = customerData
    localStorage.setItem('customer_token', newToken)
    localStorage.setItem('customer_data', JSON.stringify(customerData))
  }

  const logout = () => {
    token.value    = ''
    customer.value = null
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_data')
  }

  const fetchMe = async () => {
    if (!token.value) return
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

  return { token, customer, isLoggedIn, isMember, setAuth, logout, fetchMe,
           showAuthModal, pendingPath, openAuthModal }
})
