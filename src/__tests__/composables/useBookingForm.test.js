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
}))

import * as api from '@/api/bookingApi'
import { getMyCredits } from '@/api/authApi'
import { useBookingForm } from '@/composables/useBookingForm'

const ok = (data) => ({ data: { data } })
const slots = (...ts) => ts.map((t) => ({ start_time: t, end_time: t, available: true, price: 1 }))

const setup = async () => {
  const pinia = createPinia(); setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'A', type: 'member' })
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
  })
  afterEach(() => { vi.useRealTimers() })

  it('"today" is the local date (not UTC) so early-morning WIB users cannot pick yesterday', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 8, 1, 30)) // 01:30 WIB = 7 Okt di UTC
    const b = await setup()
    expect(b.today).toBe('2026-10-08')
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
})
