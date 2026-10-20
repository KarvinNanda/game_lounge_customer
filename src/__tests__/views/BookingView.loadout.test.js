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
const STORES = [
  { id: 's1', name: 'Quantum Bekasi', address: 'Jl. A' },
  { id: 's2', name: 'Quantum BSD', address: 'Jl. B' },
]
const ROOM  = { id: 8, name: 'VIP Room', capacity_min: 2, capacity_max: 6, min_price: 25000 }
const SLOTS = ['14:00', '15:00'].map((t) => ({ start_time: t, end_time: t, available: true }))
const QUOTE = { available: true, total_price: 50000, base_price: 50000, breakdown: [] }

let router
const mountView = async (path = '/booking') => {
  const pinia = createPinia(); setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'A', type: 'member' })
  router = createRouter({ history: createMemoryHistory(), routes: ['/', '/booking', '/credits'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push(path); await router.isReady()
  const w = mount(BookingView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}
const steps  = (w) => w.findAll('section[data-step]')
const states = (w) => steps(w).map((s) => s.attributes('data-state'))
const radio  = (w, label) => w.findAll('[role="radio"]').find((r) => r.text().includes(label))
const ubah   = (w, i) => steps(w)[i].find('button[aria-expanded="false"]')
const bar    = (w) => w.find('[data-pay-bar]')
const barBtn = (w) => bar(w).findAll('button').at(-1)

const toSlots = async (w) => {
  await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
  await radio(w, 'VIP Room').trigger('click'); await flushPromises()
  await w.findAll('[data-day]')[1].trigger('click'); await flushPromises()
}
const pickSlot = async (w, i = 0) => {
  await w.findAll('[data-slot]')[i].trigger('click')
  vi.advanceTimersByTime(250); await flushPromises()
}

describe('BookingView loadout (sequential, locked steps)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    api.getPublicStores.mockResolvedValue(ok(STORES))
    api.getPublicRoomTemplates.mockResolvedValue(ok([ROOM]))
    api.getBookingSlots.mockResolvedValue(ok({ slots: SLOTS }))
    api.getMyVouchersForBooking.mockResolvedValue(ok([]))
    api.getBookingQuote.mockResolvedValue(ok(QUOTE))
    getMyCredits.mockResolvedValue(ok([]))
  })
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

  it('renders 4 steps: branch active, the rest locked', async () => {
    const w = await mountView()
    expect(states(w)).toEqual(['active', 'locked', 'locked', 'locked'])
  })

  it('a locked step has no options inside and says what unlocks it', async () => {
    const w = await mountView()
    expect(steps(w)[1].text()).toContain('Pilih cabang dulu')
    expect(steps(w)[1].findAll('[role="radio"]')).toHaveLength(0)
    expect(steps(w)[3].findAll('[data-slot]')).toHaveLength(0)
  })

  it('choosing a branch marks it done with its name and unlocks rooms', async () => {
    const w = await mountView()
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    expect(states(w)).toEqual(['done', 'active', 'locked', 'locked'])
    expect(steps(w)[0].text()).toContain('Quantum Bekasi')
  })

  it('"Ubah" reopens a done step; "Batal" closes it without changes', async () => {
    const w = await mountView()
    await toSlots(w)
    await ubah(w, 1).trigger('click')
    expect(states(w)[1]).toBe('active')
    await steps(w)[1].findAll('button').find((b) => b.text() === 'Batal').trigger('click')
    expect(states(w)).toEqual(['done', 'done', 'done', 'active'])
  })

  it('switching to a different branch resets the room and says so', async () => {
    const w = await mountView()
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    await radio(w, 'VIP Room').trigger('click'); await flushPromises()
    await ubah(w, 0).trigger('click')
    await radio(w, 'Quantum BSD').trigger('click'); await flushPromises()
    expect(toast.info).toHaveBeenCalledWith('Ruangan & jam di-reset')
    expect(states(w)).toEqual(['done', 'active', 'locked', 'locked'])
  })

  it('re-picking the same branch or room via "Ubah" keeps later choices', async () => {
    const w = await mountView()
    await toSlots(w)
    await ubah(w, 0).trigger('click')
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    expect(steps(w)[1].text()).toContain('VIP Room')
    expect(states(w)[3]).toBe('active')
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('picking several hours keeps the hour step active (multi-hour booking)', async () => {
    const w = await mountView()
    await toSlots(w)
    await w.findAll('[data-slot]')[0].trigger('click')
    await w.findAll('[data-slot]')[1].trigger('click')
    expect(states(w)[3]).toBe('active')
    expect(w.findAll('[data-slot][aria-pressed="true"]')).toHaveLength(2)
  })

  it('pay bar: starting price after a room, server total after a slot, Lanjut locked with a hint until ready', async () => {
    const w = await mountView()
    await radio(w, 'Quantum Bekasi').trigger('click'); await flushPromises()
    await radio(w, 'VIP Room').trigger('click'); await flushPromises()
    expect(bar(w).text()).toContain('Mulai')
    expect(bar(w).find('[data-total]').text()).toContain('25RB/jam')
    expect(barBtn(w).text()).toContain('Lanjut')
    expect(barBtn(w).attributes('disabled')).toBeDefined()
    expect(bar(w).text()).toContain('Lengkapi 2 langkah lagi')
    await w.findAll('[data-day]')[1].trigger('click'); await flushPromises()
    await pickSlot(w)
    expect(bar(w).find('[data-total]').text()).toContain('Rp 50.000')
    expect(barBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('"Lanjut" opens checkout (?step=pay) with "Bayar Sekarang" disabled until a method is chosen', async () => {
    const w = await mountView()
    await toSlots(w)
    await pickSlot(w)
    await barBtn(w).trigger('click'); await flushPromises()
    expect(router.currentRoute.value.query.step).toBe('pay')
    expect(w.find('[data-checkout="screen"]').exists()).toBe(true)
    expect(steps(w)).toHaveLength(0)
    expect(barBtn(w).text()).toContain('Bayar Sekarang')
    expect(barBtn(w).attributes('disabled')).toBeDefined()
  })

  it('the checkout back button returns to the loadout with choices kept', async () => {
    const w = await mountView()
    await toSlots(w)
    await pickSlot(w)
    await barBtn(w).trigger('click'); await flushPromises()
    await w.find('button[aria-label="Kembali ke pilihan"]').trigger('click'); await flushPromises()
    expect(router.currentRoute.value.query.step).toBeUndefined()
    expect(states(w)).toEqual(['done', 'done', 'done', 'active'])
    expect(w.findAll('[data-slot][aria-pressed="true"]')).toHaveLength(1)
  })

  it('opening /booking?step=pay with an empty form falls back to the loadout', async () => {
    const w = await mountView('/booking?step=pay')
    expect(router.currentRoute.value.query.step).toBeUndefined()
    expect(w.find('[data-checkout="screen"]').exists()).toBe(false)
    expect(states(w)[0]).toBe('active')
  })

  it('the pay bar offers a retry when the price fails to load', async () => {
    api.getBookingQuote.mockRejectedValueOnce(new Error('timeout')).mockResolvedValue(ok(QUOTE))
    const w = await mountView()
    await toSlots(w)
    await pickSlot(w)
    const retry = bar(w).findAll('button').find((b) => b.text().includes('Coba lagi'))
    await retry.trigger('click'); await flushPromises()
    expect(bar(w).text()).toContain('Rp 50.000')
  })

  it('has a single h1 "Booking Ruangan"', async () => {
    const w = await mountView()
    expect(w.findAll('h1')).toHaveLength(1)
    expect(w.find('h1').text()).toBe('Booking Ruangan')
  })
})
