import { describe, it, expect } from 'vitest'
import api, { publicApi } from '@/api/index'

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
    // axios instance stores the baseURL in its defaults
    expect(api.defaults.baseURL).toMatch(/localhost|\/api/)
  })

  it('publicApi uses the same base URL as api', () => {
    expect(publicApi.defaults.baseURL).toBe(api.defaults.baseURL)
  })

  it('api has a request interceptor registered (attaches Bearer token)', async () => {
    // Verify the interceptor exists by checking the handlers list
    // axios stores request interceptors in interceptors.request.handlers
    const handlers = api.interceptors.request.handlers
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('api has a response interceptor registered (handles 401)', () => {
    const handlers = api.interceptors.response.handlers
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('publicApi has no custom request interceptors', () => {
    const handlers = publicApi.interceptors.request.handlers
    // publicApi should have no registered interceptors (empty or null entries only)
    const active = (handlers || []).filter(Boolean)
    expect(active).toHaveLength(0)
  })

  it('api request interceptor adds Authorization header from localStorage', async () => {
    localStorage.setItem('customer_token', 'test-bearer-token')

    // Invoke the registered fulfillment handler directly
    const handler = api.interceptors.request.handlers.find(Boolean)
    const config = { headers: {} }
    const result = handler.fulfilled(config)

    expect(result.headers.Authorization).toBe('Bearer test-bearer-token')
  })

  it('api request interceptor does not add Authorization header when no token', async () => {
    localStorage.removeItem('customer_token')

    const handler = api.interceptors.request.handlers.find(Boolean)
    const config = { headers: {} }
    const result = handler.fulfilled(config)

    expect(result.headers.Authorization).toBeUndefined()
  })

  it('api response interceptor clears localStorage on 401 and redirects', () => {
    localStorage.setItem('customer_token', 'expired')
    localStorage.setItem('customer_data', '{"name":"Test"}')

    const handler = api.interceptors.response.handlers.find(Boolean)
    const error = { response: { status: 401 } }

    // The interceptor calls window.location.href = '/login' and returns a rejected promise
    return handler.rejected(error).catch(() => {
      expect(localStorage.getItem('customer_token')).toBeNull()
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
