import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const defaultHeaders = { 'Content-Type': 'application/json' }

// ── Cookie-based auth (httpOnly) ────────────────────────────────────
// Token TIDAK lagi disimpan/dibaca frontend. Backend set cookie
// `customer_token` (HttpOnly; SameSite=Lax; Secure) saat login.
// withCredentials: true → browser otomatis melampirkan cookie.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: defaultHeaders,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sesi habis / cookie invalid — bersihkan state customer lokal
      localStorage.removeItem('customer_data')
      // Hindari redirect loop kalau sudah di halaman login
      const currentPath = window.location?.pathname || ''
      if (!currentPath.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Public API — endpoint tanpa auth; tetap withCredentials agar konsisten
// (mis. backend bisa refresh cookie di endpoint public jika perlu)
export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: defaultHeaders,
  withCredentials: true,
})

export default api
