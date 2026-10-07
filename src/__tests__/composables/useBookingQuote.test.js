import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/api/bookingApi', () => ({ getBookingQuote: vi.fn() }))

import { getBookingQuote } from '@/api/bookingApi'
import { useBookingQuote } from '@/composables/useBookingQuote'

const params = (slots) => ({ store_id: 1, room_template_id: 2, booking_date: '2026-10-08', selected_slots: slots })
const ok = (data) => ({ data: { data } })

let scope
const setup = (initial) => {
  const source = ref(initial)
  scope = effectScope()
  const q = scope.run(() => useBookingQuote(() => source.value))
  return { source, q }
}

describe('useBookingQuote', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
  afterEach(() => { scope?.stop(); vi.useRealTimers() })

  it('does not call the API when params are incomplete (null)', async () => {
    const { q } = setup(null)
    vi.advanceTimersByTime(500)
    await flushPromises()
    expect(getBookingQuote).not.toHaveBeenCalled()
    expect(q.quote.value).toBeNull()
    expect(q.loading.value).toBe(false)
  })

  it('debounces rapid changes into one request with the latest params', async () => {
    getBookingQuote.mockResolvedValue(ok({ total_price: 90000, available: true }))
    const { source, q } = setup(params(['10:00']))
    source.value = params(['10:00', '11:00'])
    await nextTick()
    source.value = params(['10:00', '11:00', '12:00'])
    await nextTick()
    expect(q.loading.value).toBe(true)
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(getBookingQuote).toHaveBeenCalledOnce()
    expect(getBookingQuote).toHaveBeenCalledWith(params(['10:00', '11:00', '12:00']))
    expect(q.quote.value.total_price).toBe(90000)
    expect(q.loading.value).toBe(false)
  })

  it('ignores a stale response that resolves after a newer request', async () => {
    let resolveOld
    getBookingQuote
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
      .mockResolvedValueOnce(ok({ total_price: 2, available: true }))
    const { source, q } = setup(params(['10:00']))
    vi.advanceTimersByTime(250)          // request lama terkirim, belum selesai
    source.value = params(['10:00', '11:00'])
    await nextTick()
    vi.advanceTimersByTime(250)          // request baru terkirim
    await flushPromises()
    expect(q.quote.value.total_price).toBe(2)
    resolveOld(ok({ total_price: 1, available: true }))
    await flushPromises()
    expect(q.quote.value.total_price).toBe(2)  // tetap hasil terbaru
  })

  it('exposes the server error message on 400 and clears the quote', async () => {
    getBookingQuote.mockRejectedValue({ response: { status: 400, data: { message: 'Di luar jam operasional' } } })
    const { q } = setup(params(['03:00']))
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(q.error.value).toBe('Di luar jam operasional')
    expect(q.quote.value).toBeNull()
  })

  it('falls back to a generic message when the server sends none', async () => {
    getBookingQuote.mockRejectedValue(new Error('Network Error'))
    const { q } = setup(params(['10:00']))
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(q.error.value).toBe('Gagal menghitung harga. Coba lagi.')
  })

  it('flags unavailable slots', async () => {
    getBookingQuote.mockResolvedValue(ok({ total_price: 50000, available: false }))
    const { q } = setup(params(['10:00']))
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(q.unavailable.value).toBe(true)
  })

  it('resets immediately when params become null', async () => {
    getBookingQuote.mockResolvedValue(ok({ total_price: 50000, available: true }))
    const { source, q } = setup(params(['10:00']))
    vi.advanceTimersByTime(250)
    await flushPromises()
    source.value = null
    await nextTick()
    expect(q.quote.value).toBeNull()
    expect(q.error.value).toBe('')
    expect(q.loading.value).toBe(false)
  })

  it('refresh() retries the same params after a failure', async () => {
    getBookingQuote
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(ok({ total_price: 68000, available: true }))
    const { q } = setup(params(['10:00']))
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(q.error.value).not.toBe('')
    q.refresh()
    await flushPromises()
    expect(getBookingQuote).toHaveBeenCalledTimes(2)
    expect(q.error.value).toBe('')
    expect(q.quote.value.total_price).toBe(68000)
  })
})
