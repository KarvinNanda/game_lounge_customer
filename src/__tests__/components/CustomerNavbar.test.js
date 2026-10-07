import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import CustomerNavbar from '@/components/CustomerNavbar.vue'

vi.mock('@/api/authApi', () => ({
  getCustomerMe:      vi.fn(),
  customerLogout:     vi.fn().mockResolvedValue({}),
  getCreditsExpiring: vi.fn().mockResolvedValue({ data: { data: { credits: [], count: 0 } } }),
}))

const PATHS = ['/', '/login', '/profile', '/my-fnb-orders', '/my-bookings', '/my-credits', '/promo']

const mountNav = async (loggedIn = false) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  if (loggedIn) useAuthStore().setAuth({ name: 'Alice Wonder' })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: PATHS.map((p) => ({ path: p, component: { template: '<div/>' } })),
  })
  await router.push('/')
  await router.isReady()
  const w = mount(CustomerNavbar, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}

describe('CustomerNavbar', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('guest sees a single Login link (no button nested in a link)', async () => {
    const w = await mountNav(false)
    const login = w.findAll('a').find((a) => a.text() === 'Login')
    expect(login.attributes('href')).toBe('/login')
    expect(login.find('button').exists()).toBe(false)
  })

  it('marks Home as current page', async () => {
    const w = await mountNav(false)
    const home = w.findAll('a').find((a) => a.text() === 'Home')
    expect(home.attributes('aria-current')).toBe('page')
  })

  it('logged-in user gets labelled icon buttons with aria-expanded', async () => {
    const w = await mountNav(true)
    const bell = w.find('button[aria-label^="Notifikasi"]')
    expect(bell.attributes('aria-expanded')).toBe('false')
    await bell.trigger('click')
    expect(bell.attributes('aria-expanded')).toBe('true')
    expect(w.text()).toContain('Tidak ada notifikasi baru')
  })

  it('Escape closes open menus', async () => {
    const w = await mountNav(true)
    await w.find('button[aria-label="Menu profil"]').trigger('click')
    expect(w.text()).toContain('Profil Saya')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(w.text()).not.toContain('Profil Saya')
  })

  it('click-outside overlay is rendered outside <nav> so it covers the whole viewport', async () => {
    const w = await mountNav(true)
    await w.find('button[aria-label="Menu profil"]').trigger('click')
    // backdrop-filter on <nav> makes fixed children relative to the nav, not the viewport
    expect(w.find('nav [data-menu-overlay]').exists()).toBe(false)
    const overlay = document.body.querySelector('[data-menu-overlay]')
    expect(overlay).not.toBeNull()
    overlay.click()
    await flushPromises()
    expect(w.text()).not.toContain('Profil Saya')
  })

  it('renders logged-in desktop links as real links (middle-click / new tab works)', async () => {
    const w = await mountNav(true)
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/my-bookings', '/my-credits', '/promo']))
  })

  it('announces the unread notification count to screen readers', async () => {
    const { getCreditsExpiring } = await import('@/api/authApi')
    getCreditsExpiring.mockResolvedValueOnce({ data: { data: { credits: [{ id: 1 }, { id: 2 }], count: 2 } } })
    const w = await mountNav(true)
    expect(w.find('button[aria-label="Notifikasi, 2 belum dibaca"]').exists()).toBe(true)
  })
})
