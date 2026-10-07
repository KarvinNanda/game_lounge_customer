import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn(), getMyCredits: vi.fn() }))
vi.mock('@/api/bookingApi', () => ({
  getPublicStores: vi.fn(), getPublicRoomTemplates: vi.fn(), getBookingSlots: vi.fn(),
  getMyVouchersForBooking: vi.fn(), initiateBooking: vi.fn(), getBookingQuote: vi.fn(),
}))

import * as api from '@/api/bookingApi'
import { getMyCredits } from '@/api/authApi'
import BookingView from '@/views/BookingView.vue'

const ok = (data) => ({ data: { data } })
const STORE = { id: 's1', name: 'Quantum Bekasi', address: 'Jl. A' }
const ROOM  = { id: 8, name: 'VIP Room', capacity_min: 2, capacity_max: 6, min_price: 25000 }
const SLOTS = ['14:00', '15:00'].map((t) => ({ start_time: t, end_time: t, available: true }))

const mountView = async () => {
  const pinia = createPinia(); setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'A', type: 'member' })
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/booking', '/credits'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push('/booking'); await router.isReady()
  const w = mount(BookingView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}
const steps = (w) => w.findAll('section[data-step]')
const radio = (w, label) => w.findAll('[role="radio"]').find((r) => r.text().includes(label))

describe('BookingView accordion stepper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    api.getPublicStores.mockResolvedValue(ok([STORE]))
    api.getPublicRoomTemplates.mockResolvedValue(ok([ROOM]))
    api.getBookingSlots.mockResolvedValue(ok({ slots: SLOTS }))
    api.getMyVouchersForBooking.mockResolvedValue(ok([]))
    api.getBookingQuote.mockResolvedValue(ok({ available: true, total_price: 50000, base_price: 50000, breakdown: [] }))
    getMyCredits.mockResolvedValue(ok([]))
  })
  afterEach(() => { vi.useRealTimers() })

  it('shows 5 steps with only the first open', async () => {
    const w = await mountView()
    expect(steps(w)).toHaveLength(5)
    expect(steps(w).map((s) => s.attributes('data-open'))).toEqual(['true', 'false', 'false', 'false', 'false'])
  })

  it('choosing a branch collapses it into a summary and opens the room step', async () => {
    const w = await mountView()
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    expect(steps(w)[0].attributes('data-open')).toBe('false')
    expect(steps(w)[0].text()).toContain('Quantum Bekasi')
    expect(steps(w)[1].attributes('data-open')).toBe('true')
  })

  it('"Ubah" reopens a completed step and closes the current one', async () => {
    const w = await mountView()
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    await radio(w, 'VIP Room').trigger('click'); await flushPromises()
    expect(steps(w)[2].attributes('data-open')).toBe('true')
    await steps(w)[0].find('button[aria-expanded="false"]').trigger('click')
    expect(steps(w)[0].attributes('data-open')).toBe('true')
    expect(steps(w)[2].attributes('data-open')).toBe('false')
  })

  const toSlots = async (w) => {
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    await radio(w, 'VIP Room').trigger('click'); await flushPromises()
    await w.findAll('button').find((b) => b.text() === 'Besok').trigger('click'); await flushPromises()
  }

  it('the hour step stays open while picking several hours (multi-hour booking)', async () => {
    const w = await mountView()
    await toSlots(w)
    await w.findAll('[data-slot]')[0].trigger('click')
    await w.findAll('[data-slot]')[1].trigger('click')
    expect(steps(w)[3].attributes('data-open')).toBe('true')
    expect(w.findAll('[data-slot][aria-pressed="true"]')).toHaveLength(2)
  })

  it('the sticky bar shows the server total and "Lanjut", then "Bayar Sekarang" on the payment step', async () => {
    const w = await mountView()
    expect(w.find('[data-pay-bar]').exists()).toBe(false)
    await toSlots(w)
    await w.findAll('[data-slot]')[0].trigger('click')
    vi.advanceTimersByTime(250); await flushPromises()
    const bar = () => w.find('[data-pay-bar]')
    expect(bar().text()).toContain('Rp 50.000')
    expect(bar().find('button').text()).toContain('Lanjut')
    await bar().find('button').trigger('click')
    expect(steps(w)[3].attributes('data-open')).toBe('false')
    expect(steps(w)[4].attributes('data-open')).toBe('true')
    expect(bar().find('button').text()).toContain('Bayar Sekarang')
    expect(bar().find('button').attributes('disabled')).toBeDefined() // metode bayar belum dipilih
  })

  it('"Lanjut" inside the hour step also moves on to payment', async () => {
    const w = await mountView()
    await toSlots(w)
    await w.findAll('[data-slot]')[0].trigger('click')
    await steps(w)[3].findAll('button').find((b) => b.text().includes('Lanjut')).trigger('click')
    expect(steps(w)[4].attributes('data-open')).toBe('true')
  })

  it('has a single h1 page title', async () => {
    const w = await mountView()
    expect(w.findAll('h1')).toHaveLength(1)
    expect(w.find('h1').text()).toBe('Booking Ruangan')
  })

  it('re-picking the same branch or room via "Ubah" keeps later choices', async () => {
    const w = await mountView()
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    await radio(w, 'VIP Room').trigger('click'); await flushPromises()
    await w.findAll('button').find((b) => b.text() === 'Besok').trigger('click'); await flushPromises()
    await steps(w)[0].find('button[aria-expanded="false"]').trigger('click')
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    expect(steps(w)[1].text()).toContain('VIP Room')   // ruangan tidak ter-reset
    expect(steps(w)[3].attributes('data-open')).toBe('true')
    await steps(w)[1].find('button[aria-expanded="false"]').trigger('click')
    await radio(w, 'VIP Room').trigger('click'); await flushPromises()
    expect(steps(w)[3].attributes('data-open')).toBe('true') // tanggal tetap terisi
  })
})
