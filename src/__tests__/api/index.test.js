import { describe, it, expect } from 'vitest'
import api, { publicApi } from '@/api/index'

// ── Cookie-based auth (httpOnly) ────────────────────────────────────
// Kontrak baru: token TIDAK pernah disentuh frontend. Browser
// melampirkan cookie via withCredentials — tidak ada Authorization
// header, tidak ada customer_token di localStorage.

describe('api/index', () => {
  it('exports api as the default export', () => {
    expect(api).toBeDefined()
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.put).toBe('function')
  })

  it('exports publicApi as a named export', () => {
    expect(publicApi).toBeDefined()
    expect(typeof publicApi.get).toBe('function')
    expect(typeof publicApi.post).toBe('function')
  })

  it('api and publicApi are different instances', () => {
    expect(api).not.toBe(publicApi)
  })

  it('api base URL falls back to localhost when VITE_API_URL is not set', () => {
    expect(api.defaults.baseURL).toMatch(/localhost|\/api/)
  })

  it('publicApi uses the same base URL as api', () => {
    expect(publicApi.defaults.baseURL).toBe(api.defaults.baseURL)
  })

  // ── withCredentials: cookie httpOnly dilampirkan otomatis ─────────

  it('api sends credentials (cookie) with every request', () => {
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('publicApi sends credentials (cookie) with every request', () => {
    expect(publicApi.defaults.withCredentials).toBe(true)
  })

  // ── Tidak ada lagi Authorization header dari localStorage ─────────

  it('api has NO request interceptor (no Bearer token handling)', () => {
    const active = (api.interceptors.request.handlers || []).filter(Boolean)
    expect(active).toHaveLength(0)
  })

  it('publicApi has no custom request interceptors', () => {
    const active = (publicApi.interceptors.request.handlers || []).filter(Boolean)
    expect(active).toHaveLength(0)
  })

  // ── 401 handling ──────────────────────────────────────────────────

  it('api has a response interceptor registered (handles 401)', () => {
    const handlers = api.interceptors.response.handlers
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('api response interceptor clears customer_data on 401 and redirects', () => {
    localStorage.setItem('customer_data', '{"name":"Test"}')

    const handler = api.interceptors.response.handlers.find(Boolean)
    const error = { response: { status: 401 } }

    return handler.rejected(error).catch(() => {
      expect(localStorage.getItem('customer_data')).toBeNull()
      expect(window.location.href).toBe('/login')
    })
  })

  it('api response interceptor passes through non-401 errors unchanged', () => {
    const handler = api.interceptors.response.handlers.find(Boolean)
    const error = { response: { status: 500 } }

    return handler.rejected(error).catch((err) => {
      expect(err).toBe(error)
    })
  })
})
