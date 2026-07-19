import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const defaultHeaders = { 'Content-Type': 'application/json' }

// Authenticated API — attaches customer token automatically
const api = axios.create({ baseURL: BASE_URL, timeout: 10000, headers: defaultHeaders })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customer_token')
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

// Public API — no auth header, for endpoints accessible without login
export const publicApi = axios.create({ baseURL: BASE_URL, timeout: 10000, headers: defaultHeaders })

export default api
