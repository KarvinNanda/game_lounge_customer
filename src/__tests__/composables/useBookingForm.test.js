import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn(), getMyCredits: vi.fn() }))
vi.mock('@/api/bookingApi', () => ({
  getPublicStores: vi.fn(), getPublicRoomTemplates: vi.fn(), getBookingSlots: vi.fn(),
  getMyVouchersForBooking: vi.fn(), initiateBooking: vi.fn(), getBookingQuote: vi.fn(),
  getCustomerBookingQuote: vi.fn(),
}))

import * as api from '@/api/bookingApi'
import { getMyCredits } from '@/api/authApi'
import { useBookingForm } from '@/composables/useBookingForm'

const ok = (data) => ({ data: { data } })
const slots = (...ts) => ts.map((t) => ({ start_time: t, end_time: t, available: true, price: 1 }))

const setup = async ({ guest = false } = {}) => {
  const pinia = createPinia(); setActivePinia(pinia)
  if (!guest) useAuthStore().setAuth({ name: 'A', type: 'member' })
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
  await router.push('/'); await router.isReady()
  let b
  mount(defineComponent({ setup() { b = useBookingForm(); return () => h('div') } }), { global: { plugins: [router, pinia] } })
  await flushPromises()
  return b
}

describe('useBookingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getPublicStores.mockResolvedValue(ok([]))
    api.getPublicRoomTemplates.mockResolvedValue(ok([]))
    api.getMyVouchersForBooking.mockResolvedValue(ok([]))
    api.getBookingQuote.mockResolvedValue(ok({ total_price: 1, available: true }))
    api.getCustomerBookingQuote.mockResolvedValue(ok({ total_price: 1, available: true }))
  })
  afterEach(() => { vi.useRealTimers() })

  it('"today" is the local date (not UTC) so early-morning WIB users cannot pick yesterday', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 8, 1, 30)) // 01:30 WIB = 7 Okt di UTC
    const b = await setup()
    expect(b.today).toBe('2026-10-08')
  })

  it('reloads vouchers one minute after a reserved voucher unlocks', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T20:30:10+07:00'))
    const locked = { voucher_id: 'v9', reserved_until: '2026-11-16T20:32:10+07:00', hold_id: 'h1' }
    api.getBookingSlots.mockResolvedValue(ok({ slots: slots('10:00') }))
    api.getMyVouchersForBooking.mockResolvedValue(ok([locked]))
    const b = await setup()
    Object.assign(b.form, { storeId: 's', roomTemplateId: 1, date: '2026-11-17' })
    b.onDateChange(); await flushPromises()
    expect(api.getMyVouchersForBooking).toHaveBeenCalledTimes(1)
    api.getMyVouchersForBooking.mockResolvedValue(ok([{ ...locked, reserved_until: null, hold_id: null }]))
    await vi.advanceTimersByTimeAsync(3 * 60_000)
    await flushPromises()
    expect(api.getMyVouchersForBooking).toHaveBeenCalledTimes(2)
    expect(api.getMyVouchersForBooking).toHaveBeenLastCalledWith({ store_id: 's', room_template_id: 1 })
    expect(b.availableVouchers.value[0].reserved_until).toBeNull()
  })

  it('drops a selected credit that is no longer valid after the slots change', async () => {
    api.getBookingSlots.mockResolvedValue(ok({ slots: slots('10:00', '11:00', '12:00') }))
    getMyCredits.mockResolvedValue(ok([{ id: 'c2', remaining_hours: 2, expires_at: '2099-01-01', is_active: true }]))
    const b = await setup()
    Object.assign(b.form, { storeId: 's', roomTemplateId: 1, date: '2026-10-08' })
    b.onDateChange(); await flushPromises()
    b.toggleSlot('10:00'); b.toggleSlot('11:00'); await flushPromises()
    b.selectCredit({ id: 'c2' })
    expect(b.form.paymentMethod).toBe('play_credits')
    b.toggleSlot('12:00'); await flushPromises() // 3 jam > sisa 2 jam
    expect(b.selectedCreditId.value).toBe('')
    expect(b.form.paymentMethod).toBe('')
  })

  it('ignores slots from an older date request that resolves late', async () => {
    let resolveOld
    api.getBookingSlots
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
      .mockResolvedValueOnce(ok({ slots: slots('20:00') }))
    const b = await setup()
    Object.assign(b.form, { storeId: 's', roomTemplateId: 1, date: '2026-10-08' })
    b.onDateChange()
    b.form.date = '2026-10-09'
    b.onDateChange(); await flushPromises()
    resolveOld(ok({ slots: slots('10:00') })); await flushPromises()
    expect(b.hourlySlots.value.map((s) => s.start_time)).toEqual(['20:00'])
    expect(b.loadingSlots.value).toBe(false)
  })

  it('clears the voucher id together with the voucher on branch/room change', async () => {
    const b = await setup()
    b.onSelectVoucher({ voucher_id: 'v1', code: 'X' })
    b.onRoomSelect({ id: 2 })
    expect(b.selectedVoucher.value).toBeNull()
    expect(b.form.voucherID).toBe('')
    b.onSelectVoucher({ voucher_id: 'v1', code: 'X' })
    b.form.storeId = 's'
    await b.onStoreChange()
    expect(b.form.voucherID).toBe('')
  })

  it('choosing play credits removes a selected voucher (they cannot be combined)', async () => {
    const b = await setup()
    b.onSelectVoucher({ voucher_id: 'v1', code: 'X' })
    b.selectCredit({ id: 'c1' })
    expect(b.selectedVoucher.value).toBeNull()
    expect(b.form.voucherID).toBe('')
  })

  // Harga dengan voucher dihitung server (GET /customer/bookings/quote), tidak di FE lagi
  describe('server-side voucher price', () => {
    const atSlots = async (opts) => {
      vi.useFakeTimers()
      api.getBookingSlots.mockResolvedValue(ok({ slots: slots('10:00') }))
      const b = await setup(opts)
      Object.assign(b.form, { storeId: 's', roomTemplateId: 1, date: '2026-10-08' })
      b.onDateChange(); await flushPromises()
      b.toggleSlot('10:00')
      await vi.advanceTimersByTimeAsync(300); await flushPromises()
      return b
    }
    const QUOTED = { total_price: 33333, discount_amount: 5000, final_price: 28333, voucher_id: 'v1', voucher_code: 'HEMAT15', available: true }

    it('logged in: asks the customer quote with the selected voucher and shows its numbers', async () => {
      const b = await atSlots()
      expect(api.getCustomerBookingQuote).toHaveBeenLastCalledWith({
        store_id: 's', room_template_id: 1, booking_date: '2026-10-08', selected_slots: ['10:00'],
      })
      api.getCustomerBookingQuote.mockResolvedValue(ok(QUOTED))
      b.onSelectVoucher({ voucher_id: 'v1', code: 'HEMAT15' })
      await vi.advanceTimersByTimeAsync(300); await flushPromises()
      expect(api.getCustomerBookingQuote).toHaveBeenLastCalledWith(expect.objectContaining({ voucher_id: 'v1' }))
      expect(b.discountAmount.value).toBe(5000)
      expect(b.payableAmount.value).toBe(28333)
      expect(api.getBookingQuote).not.toHaveBeenCalled()
    })

    it('guest: uses the public quote, payable = total_price', async () => {
      api.getBookingQuote.mockResolvedValue(ok({ total_price: 68000, available: true }))
      const b = await atSlots({ guest: true })
      expect(api.getBookingQuote).toHaveBeenCalled()
      expect(api.getCustomerBookingQuote).not.toHaveBeenCalled()
      expect(b.discountAmount.value).toBe(0)
      expect(b.payableAmount.value).toBe(68000)
    })

    it('a voucher the server rejects (400) is removed, the reason shown, and the price asked again without it', async () => {
      const b = await atSlots()
      api.getCustomerBookingQuote.mockImplementation((p) => (p.voucher_id
        ? Promise.reject({ response: { status: 400, data: { message: 'Minimum pembelian Rp 50000' } } })
        : Promise.resolve(ok({ total_price: 33333, discount_amount: 0, final_price: 33333, available: true }))))
      b.onSelectVoucher({ voucher_id: 'v1', code: 'HEMAT15' })
      await vi.advanceTimersByTimeAsync(300); await flushPromises()
      expect(toast.error).toHaveBeenCalledWith('Minimum pembelian Rp 50000')
      expect(b.form.voucherID).toBe('')
      expect(b.selectedVoucher.value).toBeNull()
      await vi.advanceTimersByTimeAsync(300); await flushPromises()
      expect(api.getCustomerBookingQuote).toHaveBeenLastCalledWith(expect.not.objectContaining({ voucher_id: expect.anything() }))
      expect(b.payableAmount.value).toBe(33333)
      expect(b.quoteError.value).toBe('')
    })

    it.each([
      ['a network error', new Error('Network Error')],
      ['an expired session (401)', { response: { status: 401, data: { message: 'Unauthorized' } } }],
      ['a server error (500)', { response: { status: 500, data: { message: 'x' } } }],
    ])('%s keeps the voucher (it may be fine), the user can retry', async (_, err) => {
      const b = await atSlots()
      api.getCustomerBookingQuote.mockRejectedValue(err)
      b.onSelectVoucher({ voucher_id: 'v1', code: 'HEMAT15' })
      await vi.advanceTimersByTimeAsync(300); await flushPromises()
      expect(b.form.voucherID).toBe('v1')
      expect(b.quoteError.value).not.toBe('')
      expect(toast.error).not.toHaveBeenCalled()
    })
  })
})
