import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))
vi.mock('@/api/bookingApi', () => ({ getPublicStores: vi.fn(), getEventQuote: vi.fn(), initiateEventBooking: vi.fn() }))

import * as api from '@/api/bookingApi'
import { useEventBooking } from '@/composables/useEventBooking'

const ok = (data) => ({ data: { data } })
// Bentuk respons GET /public/event-booking/quote
const quote = (available = true, total = 400000) => ok({ store_id: 's1', booking_date: '2026-10-10', start_time: '14:00', end_time: '18:00', duration_hours: 4, price_per_day: 2400000, total_price: total, available })
const badRequest = (message) => Object.assign(new Error('400'), { response: { status: 400, data: { message } } })

const setup = async () => {
  const pinia = createPinia(); setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'A' })
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
  await router.push('/'); await router.isReady()
  let e
  mount(defineComponent({ setup() { e = useEventBooking(); return () => h('div') } }), { global: { plugins: [router, pinia] } })
  await flushPromises()
  return e
}
const schedule = (e, start = '14:00', end = '18:00') => Object.assign(e.form, { storeId: 's1', date: '2026-10-10', startTime: start, endTime: end })

describe('useEventBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
    api.getPublicStores.mockResolvedValue(ok([{ id: 's1', name: 'Bekasi' }]))
    api.getEventQuote.mockResolvedValue(quote())
  })
  afterEach(() => { vi.useRealTimers() })

  it('"today" is the local date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 8, 1, 30))
    expect((await setup()).today).toBe('2026-10-08')
  })

  it('asks the server quote for the exact schedule and uses its total_price', async () => {
    api.getEventQuote.mockResolvedValue(quote(true, 401000))
    const e = await setup(); schedule(e)
    await e.checkAvailability()
    expect(api.getEventQuote).toHaveBeenCalledWith({ store_id: 's1', booking_date: '2026-10-10', start_time: '14:00', end_time: '18:00' })
    expect(e.availability.value).toBe('available')
    expect(e.totalPrice.value).toBe(401000) // angka server, bukan hitungan lokal 2.400.000 / 24 × 4
  })

  it('available: false from the quote is a conflict (server also covers overnight events)', async () => {
    api.getEventQuote.mockResolvedValue(quote(false))
    const e = await setup(); schedule(e, '23:00', '01:00')
    await e.checkAvailability()
    expect(e.availability.value).toBe('conflict')
    expect(e.totalPrice.value).toBeNull()
    expect(e.canPay.value).toBe(false)
  })

  it('a 400 from the quote shows the server message and blocks paying', async () => {
    api.getEventQuote.mockRejectedValue(badRequest('harga event untuk cabang ini belum dikonfigurasi'))
    const e = await setup(); schedule(e)
    Object.assign(e.form, { eventName: 'Ultah', paymentMethod: 'qris' })
    await e.checkAvailability()
    expect(e.availability.value).toBe('error')
    expect(e.quoteError.value).toBe('harga event untuk cabang ini belum dikonfigurasi')
    expect(e.canPay.value).toBe(false)
  })

  it('a failed availability check is an error with no guessed price and no paying', async () => {
    api.getEventQuote.mockRejectedValue(new Error('timeout'))
    const e = await setup(); schedule(e)
    e.form.eventName = 'Ultah'; e.form.paymentMethod = 'qris'
    await e.checkAvailability()
    expect(e.availability.value).toBe('error')
    expect(e.totalPrice.value).toBeNull()
    expect(e.quoteError.value).toBe('')
    expect(e.canPay.value).toBe(false)
  })

  it('ignores an availability response for a schedule the user already changed', async () => {
    let resolveOld
    api.getEventQuote.mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
    const e = await setup(); schedule(e)
    const first = e.checkAvailability()
    e.form.startTime = '15:00'               // jadwal berubah → status lama tidak berlaku
    resolveOld(quote(false))
    await first
    expect(e.availability.value).toBe('idle')
  })

  it('requires an event name before paying', async () => {
    const e = await setup(); schedule(e)
    await e.checkAvailability()
    e.form.paymentMethod = 'qris'
    e.form.eventName = '   '
    expect(e.canPay.value).toBe(false)
    e.form.eventName = 'Ultah'
    expect(e.canPay.value).toBe(true)
  })

  it('sends the unchanged initiate payload and redirects to the invoice', async () => {
    api.initiateEventBooking.mockResolvedValue(ok({ invoice_url: 'https://checkout.xendit.co/web/e1', event_booking_id: 'e1', expires_at: '2026-10-08T12:30:00+07:00' }))
    const e = await setup(); schedule(e)
    await e.checkAvailability()
    Object.assign(e.form, { eventName: 'Ultah', paymentMethod: 'qris', description: '' })
    await e.handleBookEvent()
    expect(api.initiateEventBooking).toHaveBeenCalledWith({
      store_id: 's1', event_name: 'Ultah', booking_date: '2026-10-10', start_time: '14:00', end_time: '18:00',
      payment_method: 'qris', description: undefined,
    })
    expect(window.location.href).toBe('https://checkout.xendit.co/web/e1')
  })

  it('does not stay stuck when initiate returns no invoice_url', async () => {
    api.initiateEventBooking.mockResolvedValue(ok({ event_booking_id: 'e1' }))
    const e = await setup(); schedule(e)
    await e.checkAvailability()
    Object.assign(e.form, { eventName: 'Ultah', paymentMethod: 'qris' })
    await e.handleBookEvent()
    expect(e.initiating.value).toBe(false)
    expect(e.bookingError.value).toContain('Link pembayaran tidak tersedia')
  })

  it('start time equal to end time is invalid, not a 24-hour event', async () => {
    const e = await setup(); schedule(e, '10:00', '10:00')
    expect(e.durationHours.value).toBe(0)
    await e.checkAvailability()
    expect(api.getEventQuote).not.toHaveBeenCalled()
  })

  it('an old response does not cancel a newer check still in progress', async () => {
    let resolveOld, resolveNew
    api.getEventQuote
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
      .mockImplementationOnce(() => new Promise((r) => { resolveNew = r }))
    const e = await setup(); schedule(e)
    const first = e.checkAvailability()
    e.form.endTime = '19:00'
    await flushPromises()
    const second = e.checkAvailability()
    resolveOld(quote()); await first
    expect(e.availability.value).toBe('checking')
    resolveNew(quote()); await second
    expect(e.availability.value).toBe('available')
  })
})
