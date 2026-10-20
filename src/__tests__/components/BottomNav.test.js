import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import BottomNav from '@/components/BottomNav.vue'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))

const routes = ['/', '/my-bookings', '/booking', '/my-credits', '/promo', '/profile']
  .map((path) => ({ path, component: { template: '<div/>' } }))

const makeWrapper = async (currentPath = '/', loggedIn = false) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  if (loggedIn) useAuthStore().setAuth({ name: 'Alice' })
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(currentPath)
  await router.isReady()
  const wrapper = mount(BottomNav, { global: { plugins: [router, pinia] } })
  return { wrapper, router }
}
const item = (w, label) => w.findAll('a, button').find((el) => el.text() === label)

describe('BottomNav', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders Home, My Bookings, Booking, Credits, Promo in that order', async () => {
    const { wrapper } = await makeWrapper()
    expect(wrapper.findAll('a, button').map((el) => el.text())).toEqual(['Home', 'My Bookings', 'Booking', 'Credits', 'Promo'])
  })

  it('renders one svg icon per item', async () => {
    const { wrapper } = await makeWrapper()
    expect(wrapper.findAll('svg')).toHaveLength(5)
  })

  it('Booking is the raised center action', async () => {
    const { wrapper } = await makeWrapper()
    const center = wrapper.find('[data-nav-center]')
    expect(center.exists()).toBe(true)
    expect(center.text()).toBe('Booking')
  })

  it('marks the active route with aria-current', async () => {
    for (const [path, label] of [['/', 'Home'], ['/my-bookings', 'My Bookings'], ['/booking', 'Booking'], ['/my-credits', 'Credits'], ['/promo', 'Promo']]) {
      const { wrapper } = await makeWrapper(path)
      expect(item(wrapper, label).attributes('aria-current')).toBe('page')
      expect(wrapper.findAll('[aria-current="page"]')).toHaveLength(1)
    }
  })

  it.each([['My Bookings', '/my-bookings'], ['Booking', '/booking'], ['Credits', '/my-credits'], ['Promo', '/promo']])(
    'a guest tapping %s opens the login modal for %s', async (label, path) => {
      const { wrapper } = await makeWrapper()
      const openSpy = vi.spyOn(useAuthStore(), 'openAuthModal')
      await item(wrapper, label).trigger('click')
      expect(openSpy).toHaveBeenCalledWith(path)
    })

  it('a logged-in user navigates directly (no modal)', async () => {
    const { wrapper, router } = await makeWrapper('/', true)
    const openSpy = vi.spyOn(useAuthStore(), 'openAuthModal')
    await item(wrapper, 'Booking').trigger('click')
    await new Promise((r) => setTimeout(r))
    expect(openSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/booking')
  })
})
