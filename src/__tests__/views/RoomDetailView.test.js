import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))
vi.mock('@/api/bookingApi', () => ({
  getRoomTemplateById: vi.fn(), getPublicStores: vi.fn(), getPublicRoomTemplates: vi.fn(),
}))
import * as api from '@/api/bookingApi'
import RoomDetailView from '@/views/RoomDetailView.vue'

const ok = (data) => ({ data: { data } })
const ROOM = { id: 8, name: 'VIP Room', capacity_min: 2, capacity_max: 6, image_url: '', description: 'Nyaman', facilities: [{ id: 1, name: 'PlayStation 5' }] }

const mountView = async (loggedIn) => {
  const pinia = createPinia(); setActivePinia(pinia)
  if (loggedIn) useAuthStore().setAuth({ name: 'A' })
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/room/:id', component: { template: '<div/>' } },
    { path: '/booking', component: { template: '<div/>' } },
  ] })
  await router.push('/room/8'); await router.isReady()
  const w = mount(RoomDetailView, { global: { plugins: [router, pinia] } })
  await flushPromises()
  return { w, router }
}

describe('RoomDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getRoomTemplateById.mockResolvedValue(ok(ROOM))
    api.getPublicStores.mockResolvedValue(ok([{ id: 's1', name: 'Bekasi' }]))
    api.getPublicRoomTemplates.mockResolvedValue(ok([{ id: 8, min_price: 25000 }]))
  })

  it('shows the room with facilities and no broken image when image_url is empty', async () => {
    const { w } = await mountView(true)
    expect(w.find('h1').text()).toBe('VIP Room')
    expect(w.text()).toContain('2–6 orang')
    expect(w.text()).toContain('PlayStation 5')
    expect(w.find('img').exists()).toBe(false)
  })

  it('booking CTA keeps the /booking?store_id&room_template_id contract', async () => {
    const { w, router } = await mountView(true)
    await w.find('[role="radio"]').trigger('click'); await flushPromises()
    expect(w.text()).toContain('Rp 25.000')
    await w.findAll('button').find((b) => b.text().includes('Booking Sekarang')).trigger('click'); await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/booking?store_id=s1&room_template_id=8')
  })

  it('guests get a login prompt instead of the branch picker', async () => {
    const { w } = await mountView(false)
    const spy = vi.spyOn(useAuthStore(), 'openAuthModal')
    await w.findAll('button').find((b) => b.text().includes('Login')).trigger('click')
    expect(spy).toHaveBeenCalledWith('/room/8')
  })

  it('shows a not-found state when the room fails to load', async () => {
    api.getRoomTemplateById.mockRejectedValue(new Error('404'))
    const { w } = await mountView(true)
    expect(w.text()).toContain('Ruangan tidak ditemukan')
  })
})
