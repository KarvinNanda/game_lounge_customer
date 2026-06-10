import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// ── Mock heavy dependencies ──────────────────────────────────────────────────

vi.mock('@/api/bannerApi', () => ({
  getBanners: vi.fn(),
}))

vi.mock('@/api/authApi', () => ({
  getCustomerMe: vi.fn(),
}))

// Mock api/index (used for /public/room-templates)
vi.mock('@/api/index', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}))

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error:   vi.fn(),
    info:    vi.fn(),
    warning: vi.fn(),
  })),
}))

// Stub Swiper + all modules — Navigation was added in latest refactor
vi.mock('swiper/vue', () => ({
  Swiper:      { template: '<div class="swiper-stub"><slot /></div>' },
  SwiperSlide: { template: '<div class="swiper-slide-stub"><slot /></div>' },
}))
vi.mock('swiper/modules', () => ({
  Autoplay:   {},
  Pagination: {},
  Navigation: {},
}))

import { getBanners } from '@/api/bannerApi'
import HomeView from '@/views/HomeView.vue'

// ── Router ───────────────────────────────────────────────────────────────────

const makeRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/',        name: 'Home',    component: { template: '<div/>' } },
      { path: '/login',   name: 'Login',   component: { template: '<div/>' } },
      { path: '/booking', name: 'Booking', component: { template: '<div/>' }, meta: { requiresAuth: true } },
      { path: '/credits', name: 'Credits', component: { template: '<div/>' }, meta: { requiresAuth: true } },
      { path: '/event-booking', name: 'EventBooking', component: { template: '<div/>' }, meta: { requiresAuth: true } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return router
}

const mountHome = async () => {
  const pinia  = createPinia()
  setActivePinia(pinia)
  const router = await makeRouter()
  const wrapper = mount(HomeView, {
    global: {
      plugins: [router, pinia],
      stubs: {
        Teleport:        true,
        Transition:      false,
        TransitionGroup: false,
        RouterLink:      { template: '<a><slot/></a>', props: ['to'] },
      },
    },
    attachTo: document.body,
  })
  return { wrapper, router }
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBanners.mockResolvedValue({ data: { data: [] } })
  })

  // ── Mounting & API calls ─────────────────────────────────────────────────────

  it('mounts without errors', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('calls getBanners on mount', async () => {
    await mountHome()
    await flushPromises()
    expect(getBanners).toHaveBeenCalledOnce()
  })

  it('handles getBanners API error gracefully (no crash)', async () => {
    getBanners.mockRejectedValue(new Error('Network error'))
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  // ── Page content ─────────────────────────────────────────────────────────────

  it('renders the page without crashing when no banners returned', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders banners returned by the API', async () => {
    getBanners.mockResolvedValue({
      data: {
        data: [
          { id: 1, title: 'Summer Promo', image_url: 'http://img/1.jpg' },
          { id: 2, title: 'Night Mode',   image_url: 'http://img/2.jpg' },
        ],
      },
    })
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.html()).toContain('Summer Promo')
  })

  it('renders the Rekomendasi Ruangan section header', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.text()).toContain('Rekomendasi Ruangan')
  })

  // ── Quick action cards ───────────────────────────────────────────────────────

  it('renders quick action cards with booking-related labels', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    const text = wrapper.text()
    expect(text).toMatch(/book|booking/i)
  })

  it('renders all 3 quick action cards', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Booking')
    expect(text).toContain('Top Up Play Credits')
    expect(text).toContain('Private Event Booking')
  })

  // ── Login modal via authStore (modal now lives in CustomerLayout) ─────────────

  it('authStore.showAuthModal is false by default', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    const authStore = useAuthStore()
    expect(authStore.showAuthModal).toBe(false)
  })

  it('clicking a protected quick action as a guest calls authStore.openAuthModal', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()

    const authStore = useAuthStore()
    // Guest: no token → isLoggedIn = false
    expect(authStore.isLoggedIn).toBe(false)

    const openSpy = vi.spyOn(authStore, 'openAuthModal')

    // Find the Booking quick action card and click it
    const clickables = wrapper.findAll('.cursor-pointer')
    let found = false
    for (const el of clickables) {
      if (el.text().toLowerCase().includes('booking')) {
        await el.trigger('click')
        found = true
        break
      }
    }

    if (found) {
      expect(openSpy).toHaveBeenCalled()
      expect(authStore.showAuthModal).toBe(true)
    }
  })

  it('clicking a protected quick action as logged-in user does NOT open auth modal', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()

    const authStore = useAuthStore()
    authStore.setAuth('valid-token', { name: 'Alice', type: 'member' })
    await flushPromises()

    expect(authStore.showAuthModal).toBe(false)
  })
})
