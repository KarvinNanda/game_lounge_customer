import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import BottomNav from '@/components/BottomNav.vue'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))

const routes = [
  { path: '/',            component: { template: '<div/>' } },
  { path: '/my-bookings', component: { template: '<div/>' } },
  { path: '/my-credits',  component: { template: '<div/>' } },
  { path: '/promo',       component: { template: '<div/>' } },
  { path: '/profile',     component: { template: '<div/>' } },
]

const makeWrapper = async (currentPath = '/') => {
  const pinia  = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(currentPath)
  await router.isReady()
  return mount(BottomNav, { global: { plugins: [router, pinia] } })
}

describe('BottomNav', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  it('renders 5 navigation items (1 RouterLink + 4 buttons)', async () => {
    const wrapper = await makeWrapper()
    const links   = wrapper.findAll('a')            // Home → RouterLink → <a>
    const buttons = wrapper.findAll('button')        // 4 remaining tabs
    expect(links.length + buttons.length).toBe(5)
  })

  it('renders the Home label', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.text()).toContain('Home')
  })

  it('renders the My Booking label', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.text()).toContain('My Booking')
  })

  it('renders the My Credits label', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.text()).toContain('My Credits')
  })

  it('renders the Promo label', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.text()).toContain('Promo')
  })

  it('renders the Profil label', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.text()).toContain('Profil')
  })

  it('renders all nav icons', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.findAll('svg')).toHaveLength(5)
  })

  // ── Special floating Credits button ─────────────────────────────────────────

  it('Credits button is the raised center action', async () => {
    const wrapper = await makeWrapper()
    expect(wrapper.find('[data-nav-center]').exists()).toBe(true)
  })

  it('My Credits button is marked current on /my-credits', async () => {
    const wrapper = await makeWrapper('/my-credits')
    expect(wrapper.findAll('button')[1].attributes('aria-current')).toBe('page')
  })

  // ── Active state ─────────────────────────────────────────────────────────────

  it('Home link is active (text-[#0282DE]) when path is "/"', async () => {
    const wrapper = await makeWrapper('/')
    const homeLink = wrapper.find('a')
    expect(homeLink.attributes('aria-current')).toBe('page')
  })

  it('Home link is inactive (text-[#7A8BA8]) when path is "/profile"', async () => {
    const wrapper = await makeWrapper('/profile')
    const homeLink = wrapper.find('a')
    expect(homeLink.attributes('aria-current')).toBeUndefined()
  })

  it('My Bookings button is active for paths starting with /my-bookings', async () => {
    const wrapper = await makeWrapper('/my-bookings')
    const buttons = wrapper.findAll('button')
    // buttons[0] = My Bookings, [1] = My Credits, [2] = Promo, [3] = Profile
    expect(buttons[0].attributes('aria-current')).toBe('page')
  })

  it('Profile button is active when path is "/profile"', async () => {
    const wrapper = await makeWrapper('/profile')
    const buttons = wrapper.findAll('button')
    // buttons[3] = Profile (last button)
    expect(buttons[3].attributes('aria-current')).toBe('page')
  })

  it('Promo button is active when path is "/promo"', async () => {
    const wrapper = await makeWrapper('/promo')
    const buttons = wrapper.findAll('button')
    // buttons[2] = Promo
    expect(buttons[2].attributes('aria-current')).toBe('page')
  })

  // ── Auth guard: unauthenticated user → openAuthModal ────────────────────────

  it('clicking My Bookings when logged out calls openAuthModal, not router.push', async () => {
    const wrapper  = await makeWrapper()
    const authStore = useAuthStore()

    // Guest: isLoggedIn = false (no token set)
    const openSpy = vi.spyOn(authStore, 'openAuthModal')

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')  // My Bookings

    expect(openSpy).toHaveBeenCalledWith('/my-bookings')
  })

  it('clicking Promo when logged out calls openAuthModal', async () => {
    const wrapper  = await makeWrapper()
    const authStore = useAuthStore()
    const openSpy = vi.spyOn(authStore, 'openAuthModal')

    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click')  // Promo

    expect(openSpy).toHaveBeenCalledWith('/promo')
  })

  it('clicking My Bookings when logged in navigates directly (no modal)', async () => {
    const pinia  = createPinia()
    setActivePinia(pinia)
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/')
    await router.isReady()
    const wrapper   = mount(BottomNav, { global: { plugins: [router, pinia] } })
    const authStore = useAuthStore()
    authStore.setAuth({ name: 'Alice' })

    const openSpy = vi.spyOn(authStore, 'openAuthModal')
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')  // My Bookings

    expect(openSpy).not.toHaveBeenCalled()
  })

  it('clicking My Credits when logged out opens the login modal for /my-credits', async () => {
    const wrapper   = await makeWrapper()
    const authStore = useAuthStore()
    const openSpy   = vi.spyOn(authStore, 'openAuthModal')
    await wrapper.findAll('button')[1].trigger('click')
    expect(openSpy).toHaveBeenCalledWith('/my-credits')
  })
})
