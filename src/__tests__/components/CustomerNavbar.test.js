import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { __resetCreditsSummary } from '@/composables/useCreditsSummary'
import CustomerNavbar from '@/components/CustomerNavbar.vue'

vi.mock('@/api/authApi', () => ({
  getCustomerMe:      vi.fn(),
  customerLogout:     vi.fn().mockResolvedValue({}),
  getCreditsExpiring: vi.fn().mockResolvedValue({ data: { data: { credits: [], count: 0 } } }),
  getMyCredits:       vi.fn().mockResolvedValue({ data: { data: [] } }),
}))

const PATHS = ['/', '/login', '/booking', '/profile', '/my-fnb-orders', '/my-bookings', '/my-credits', '/promo', '/payment/success', '/credits/success']

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
  w.router = router
  return w
}
const desktopLinks = (w) => w.findAll('[data-nav-links] a').map((a) => a.text())

describe('CustomerNavbar', () => {
  beforeEach(() => { vi.clearAllMocks(); __resetCreditsSummary() })

  it('guest sees a single Login link (no button nested in a link)', async () => {
    const w = await mountNav(false)
    const logins = w.findAll('a').filter((a) => a.text() === 'Login')
    expect(logins).toHaveLength(1)
    expect(logins[0].attributes('href')).toBe('/login')
    expect(logins[0].find('button').exists()).toBe(false)
  })

  it('guest sees no credits chip and no bell', async () => {
    const w = await mountNav(false)
    expect(w.find('[data-credits-chip]').exists()).toBe(false)
    expect(w.find('button[aria-label^="Notifikasi"]').exists()).toBe(false)
  })

  it('marks Home as current page', async () => {
    const w = await mountNav(false)
    const home = w.findAll('a').find((a) => a.text() === 'Home')
    expect(home.attributes('aria-current')).toBe('page')
  })

  it('logged-in desktop links are Home, Booking, My Bookings, Play Credits, Promo as real links', async () => {
    const w = await mountNav(true)
    expect(desktopLinks(w)).toEqual(['Home', 'Booking', 'My Bookings', 'Play Credits', 'Promo'])
    const hrefs = w.findAll('[data-nav-links] a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/', '/booking', '/my-bookings', '/my-credits', '/promo'])
  })

  it('a guest clicking a protected desktop link opens the login modal', async () => {
    const w = await mountNav(false)
    const openSpy = vi.spyOn(useAuthStore(), 'openAuthModal')
    await w.findAll('[data-nav-links] a').find((a) => a.text() === 'My Bookings').trigger('click')
    expect(openSpy).toHaveBeenCalledWith('/my-bookings')
  })

  it('logged-in user gets labelled icon buttons with aria-expanded', async () => {
    const w = await mountNav(true)
    const bell = w.find('button[aria-label^="Notifikasi"]')
    expect(bell.attributes('aria-expanded')).toBe('false')
    await bell.trigger('click')
    expect(bell.attributes('aria-expanded')).toBe('true')
    expect(w.text()).toContain('Tidak ada notifikasi baru')
  })

  it('the profile menu has Profil Saya, Pesanan F&B and Keluar', async () => {
    const w = await mountNav(true)
    await w.find('button[aria-label="Menu profil"]').trigger('click')
    expect(w.text()).toContain('Profil Saya')
    expect(w.text()).toContain('Pesanan F&B')
    expect(w.text()).toContain('Keluar')
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
    expect(w.find('nav [data-menu-overlay]').exists()).toBe(false)
    const overlay = document.body.querySelector('[data-menu-overlay]')
    expect(overlay).not.toBeNull()
    overlay.click()
    await flushPromises()
    expect(w.text()).not.toContain('Profil Saya')
  })

  it('announces the unread notification count to screen readers', async () => {
    const { getCreditsExpiring } = await import('@/api/authApi')
    getCreditsExpiring.mockResolvedValueOnce({ data: { data: { credits: [{ id: 1 }, { id: 2 }], count: 2 } } })
    const w = await mountNav(true)
    expect(w.find('button[aria-label="Notifikasi, 2 belum dibaca"]').exists()).toBe(true)
  })

  it('the credits chip links to Play Credits and announces the total hours', async () => {
    const { getMyCredits } = await import('@/api/authApi')
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString()
    getMyCredits.mockResolvedValueOnce({ data: { data: [{ remaining_hours: 4, expires_at: future }, { remaining_hours: 5, expires_at: future }] } })
    const w = await mountNav(true)
    const chip = w.find('[data-credits-chip]')
    expect(chip.attributes('href')).toBe('/my-credits')
    expect(chip.attributes('aria-label')).toBe('Sisa 9 jam Play Credits')
    expect(chip.text()).toContain('9')
  })
  it('refreshes the credits chip after a payment (credits may have been spent or bought)', async () => {
    const { getMyCredits } = await import('@/api/authApi')
    const w = await mountNav(true)
    const before = getMyCredits.mock.calls.length
    await w.router.push('/payment/success'); await flushPromises()
    await w.router.push('/credits/success'); await flushPromises()
    expect(getMyCredits.mock.calls.length).toBe(before + 2)
  })

  it('notification details meet AA contrast on the raised surface (no text-q-text-3)', async () => {
    const { getCreditsExpiring } = await import('@/api/authApi')
    getCreditsExpiring.mockResolvedValueOnce({ data: { data: { credits: [{ id: 1, remaining_hours: 1, expires_at: '2099-01-01', package: { name: 'P' } }], count: 1 } } })
    const w = await mountNav(true)
    await w.find('button[aria-label^="Notifikasi"]').trigger('click')
    const item = w.find('nav li')
    expect(item.html()).not.toContain('text-q-text-3')
  })
})

