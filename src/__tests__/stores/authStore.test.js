import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

// Mock the API layer so fetchMe does not make real HTTP requests
vi.mock('@/api/authApi', () => ({
  getCustomerMe: vi.fn(),
}))

import { getCustomerMe } from '@/api/authApi'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initialization ───────────────────────────────────────────────────────────

  it('starts with empty token and null customer when localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.token).toBe('')
    expect(store.customer).toBeNull()
  })

  it('hydrates token and customer from localStorage on creation', () => {
    localStorage.setItem('customer_token', 'persisted-token')
    localStorage.setItem('customer_data', JSON.stringify({ name: 'Alice', type: 'member' }))

    const store = useAuthStore()
    expect(store.token).toBe('persisted-token')
    expect(store.customer).toEqual({ name: 'Alice', type: 'member' })
  })

  it('does not crash when customer_data in localStorage is corrupted JSON', () => {
    localStorage.setItem('customer_token', 'tok')
    localStorage.setItem('customer_data', '{corrupted!!!')

    // Harus tetap bisa dibuat tanpa throw, customer fallback ke null
    const store = useAuthStore()
    expect(store.customer).toBeNull()
    expect(store.token).toBe('tok')
  })

  // ── Computed: isLoggedIn ─────────────────────────────────────────────────────

  it('isLoggedIn is false when token is empty', () => {
    const store = useAuthStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('isLoggedIn is true after setAuth', () => {
    const store = useAuthStore()
    store.setAuth('some-token', { name: 'Bob' })
    expect(store.isLoggedIn).toBe(true)
  })

  // ── Computed: isMember ───────────────────────────────────────────────────────

  it('isMember is true when customer.type === "member"', () => {
    const store = useAuthStore()
    store.setAuth('t', { name: 'Alice', type: 'member' })
    expect(store.isMember).toBe(true)
  })

  it('isMember is false when customer.type is not "member"', () => {
    const store = useAuthStore()
    store.setAuth('t', { name: 'Alice', type: 'guest' })
    expect(store.isMember).toBe(false)
  })

  it('isMember is false when customer is null', () => {
    const store = useAuthStore()
    expect(store.isMember).toBe(false)
  })

  // ── setAuth ──────────────────────────────────────────────────────────────────

  it('setAuth updates reactive token and customer', () => {
    const store = useAuthStore()
    const customer = { name: 'Charlie', type: 'member' }
    store.setAuth('new-token', customer)
    expect(store.token).toBe('new-token')
    expect(store.customer).toEqual(customer)
  })

  it('setAuth persists token to localStorage', () => {
    const store = useAuthStore()
    store.setAuth('saved-token', { name: 'Dave' })
    expect(localStorage.getItem('customer_token')).toBe('saved-token')
  })

  it('setAuth persists customer JSON to localStorage', () => {
    const store = useAuthStore()
    const customer = { name: 'Eve', type: 'member' }
    store.setAuth('t', customer)
    expect(JSON.parse(localStorage.getItem('customer_data'))).toEqual(customer)
  })

  // ── logout ───────────────────────────────────────────────────────────────────

  it('logout clears token and customer', () => {
    const store = useAuthStore()
    store.setAuth('token', { name: 'Frank' })
    store.logout()
    expect(store.token).toBe('')
    expect(store.customer).toBeNull()
  })

  it('logout removes customer_token from localStorage', () => {
    const store = useAuthStore()
    store.setAuth('token', { name: 'Frank' })
    store.logout()
    expect(localStorage.getItem('customer_token')).toBeNull()
  })

  it('logout removes customer_data from localStorage', () => {
    const store = useAuthStore()
    store.setAuth('token', { name: 'Frank' })
    store.logout()
    expect(localStorage.getItem('customer_data')).toBeNull()
  })

  // ── fetchMe ──────────────────────────────────────────────────────────────────

  it('fetchMe does nothing and skips the API call when token is empty', async () => {
    const store = useAuthStore()
    await store.fetchMe()
    expect(getCustomerMe).not.toHaveBeenCalled()
  })

  it('fetchMe calls getCustomerMe when token exists', async () => {
    const store = useAuthStore()
    store.setAuth('valid-token', { name: 'Old Name' })
    getCustomerMe.mockResolvedValueOnce({ data: { data: { name: 'New Name', type: 'member' } } })

    await store.fetchMe()
    expect(getCustomerMe).toHaveBeenCalledOnce()
  })

  it('fetchMe updates customer from API response', async () => {
    const store = useAuthStore()
    store.setAuth('valid-token', { name: 'Stale' })
    const fresh = { name: 'Fresh', type: 'member' }
    getCustomerMe.mockResolvedValueOnce({ data: { data: fresh } })

    await store.fetchMe()
    expect(store.customer).toEqual(fresh)
  })

  it('fetchMe persists updated customer to localStorage', async () => {
    const store = useAuthStore()
    store.setAuth('valid-token', { name: 'Old' })
    const fresh = { name: 'Updated', type: 'member' }
    getCustomerMe.mockResolvedValueOnce({ data: { data: fresh } })

    await store.fetchMe()
    expect(JSON.parse(localStorage.getItem('customer_data'))).toEqual(fresh)
  })

  it('fetchMe calls logout when the API throws', async () => {
    const store = useAuthStore()
    store.setAuth('bad-token', { name: 'Expire' })
    getCustomerMe.mockRejectedValueOnce(new Error('401 Unauthorized'))

    await store.fetchMe()
    expect(store.token).toBe('')
    expect(store.customer).toBeNull()
  })

  // ── Auth Modal ───────────────────────────────────────────────────────────────

  it('showAuthModal starts as false', () => {
    const store = useAuthStore()
    expect(store.showAuthModal).toBe(false)
  })

  it('pendingPath starts as empty string', () => {
    const store = useAuthStore()
    expect(store.pendingPath).toBe('')
  })

  it('openAuthModal sets showAuthModal to true', () => {
    const store = useAuthStore()
    store.openAuthModal('/booking')
    expect(store.showAuthModal).toBe(true)
  })

  it('openAuthModal stores the intended path in pendingPath', () => {
    const store = useAuthStore()
    store.openAuthModal('/my-bookings')
    expect(store.pendingPath).toBe('/my-bookings')
  })

  it('openAuthModal with no argument sets showAuthModal true and pendingPath empty', () => {
    const store = useAuthStore()
    store.openAuthModal()
    expect(store.showAuthModal).toBe(true)
    expect(store.pendingPath).toBe('')
  })

  it('openAuthModal can be called multiple times, updating pendingPath each time', () => {
    const store = useAuthStore()
    store.openAuthModal('/promo')
    store.openAuthModal('/credits')
    expect(store.pendingPath).toBe('/credits')
    expect(store.showAuthModal).toBe(true)
  })

  it('setting showAuthModal to false closes the modal', () => {
    const store = useAuthStore()
    store.openAuthModal('/profile')
    store.showAuthModal = false
    expect(store.showAuthModal).toBe(false)
  })
})
