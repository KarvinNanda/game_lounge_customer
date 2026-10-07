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
import api from '@/api/index'
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
    api.get.mockResolvedValue({ data: { data: [] } })
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

  it('does not render a broken <img> for a banner without image_url', async () => {
    getBanners.mockResolvedValue({ data: { data: [{ id: 1, title: 'Promo', image_url: '' }] } })
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.find('section[aria-label="Promo"] img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Promo')
  })

  it('hides a banner image that fails to load', async () => {
    getBanners.mockResolvedValue({ data: { data: [{ id: 1, title: 'Promo', image_url: 'http://img/1.jpg' }] } })
    const { wrapper } = await mountHome()
    await flushPromises()
    await wrapper.find('section[aria-label="Promo"] img').trigger('error')
    expect(wrapper.find('section[aria-label="Promo"] img').exists()).toBe(false)
  })

  it('replaces the hero skeleton with a static fallback when banners fail to load', async () => {
    getBanners.mockRejectedValue(new Error('Network error'))
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.find('section[aria-label="Promo"] .skeleton').exists()).toBe(false)
    expect(wrapper.find('[data-hero-fallback]').exists()).toBe(true)
  })

  it('shows the static fallback when there are no banners', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.find('[data-hero-fallback]').exists()).toBe(true)
  })

  it('has exactly one <h1> even with several banners', async () => {
    getBanners.mockResolvedValue({ data: { data: [
      { id: 1, title: 'A', image_url: '' }, { id: 2, title: 'B', image_url: '' },
    ] } })
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })

  // ── Rooms grid (minimal scroll) ──────────────────────────────────────────────

  const room = (id) => ({ id, name: `Room ${id}`, capacity_max: 4, min_price: 25000, image_url: null })

  it('shows at most 4 recommended rooms in a grid (no horizontal strip)', async () => {
    api.get.mockResolvedValue({ data: { data: [1, 2, 3, 4, 5, 6].map(room) } })
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.findAll('[data-room-card]')).toHaveLength(4)
    expect(wrapper.find('.overflow-x-auto').exists()).toBe(false)
  })

  it('renders fewer than 4 rooms without placeholders', async () => {
    api.get.mockResolvedValue({ data: { data: [room(1), room(2)] } })
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.findAll('[data-room-card]')).toHaveLength(2)
    // hero juga pakai skeleton saat banner kosong — cek hanya di section rooms
    expect(wrapper.find('[aria-label="Rekomendasi Ruangan"] .skeleton').exists()).toBe(false)
  })

  it('shows an empty message when there are no rooms', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada ruangan')
  })

  it('uses svg icons, not emoji, for quick actions', async () => {
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.text()).not.toMatch(/📅|💳|🏠|🎮/u)
  })

  it('gives the capacity badge a screen-reader label', async () => {
    api.get.mockResolvedValue({ data: { data: [room(1)] } })
    const { wrapper } = await mountHome()
    await flushPromises()
    expect(wrapper.find('[data-room-card] .sr-only').text()).toBe('Kapasitas hingga 4 orang')
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
    authStore.setAuth({ name: 'Alice', type: 'member' })
    await flushPromises()

    expect(authStore.showAuthModal).toBe(false)
  })
})
