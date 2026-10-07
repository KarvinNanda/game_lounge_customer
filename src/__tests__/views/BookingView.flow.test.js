// Characterization: mengunci perilaku BookingView sebelum dipecah (phase 2a).
// Interaksi lewat UI publik (pilih cabang/ruangan/tanggal/jam, bayar), bukan state internal.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({
  getCustomerMe: vi.fn(),
  getMyCredits:  vi.fn(),
}))
vi.mock('@/api/bookingApi', () => ({
  getPublicStores:         vi.fn(),
  getPublicRoomTemplates:  vi.fn(),
  getBookingSlots:         vi.fn(),
  getMyVouchersForBooking: vi.fn(),
  initiateBooking:         vi.fn(),
  getBookingQuote:         vi.fn(),
}))

import * as bookingApi from '@/api/bookingApi'
import { getMyCredits } from '@/api/authApi'
import BookingView from '@/views/BookingView.vue'

const STORE = { id: 's1', name: 'Quantum Bekasi', address: 'Jl. A', operating_hours: [{ open_time: '10:00:00', close_time: '23:00:00' }] }
const ROOM  = { id: 8, name: 'VIP Room', capacity_min: 2, capacity_max: 6, min_price: 25000, facilities: ['PS5'] }
const SLOTS = ['14:00', '15:00', '16:00'].map((t, i) => ({ start_time: t, end_time: ['15:00', '16:00', '17:00'][i], available: true, price: 25000 }))
const QUOTE = { available: true, base_price: 68000, flash_discount: 0, total_price: 68000, has_flash_sale: false, breakdown: [] }

const ok = (data) => ({ data: { data } })

let router
const mountBooking = async (url = '/booking') => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'Alice', type: 'member' })
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/booking', component: { template: '<div/>' } },
      { path: '/credits', component: { template: '<div/>' } },
      { path: '/payment/success', name: 'PaymentSuccess', component: { template: '<div/>' } },
    ],
  })
  await router.push(url); await router.isReady()
  const w = mount(BookingView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}

// Jalankan alur lewat handler publik yang dipakai template
const fillUntilSlots = async (w) => {
  w.vm.form.storeId = 's1'
  await w.vm.onStoreChange()
  w.vm.onRoomSelect(ROOM)
  w.vm.form.date = '2026-10-08'
  w.vm.onDateChange()
  await flushPromises()
  w.vm.toggleSlot('14:00'); w.vm.toggleSlot('15:00'); w.vm.toggleSlot('16:00')
  vi.advanceTimersByTime(250)
  await flushPromises()
}

describe('BookingView flow (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    window.location.href = ''
    bookingApi.getPublicStores.mockResolvedValue(ok([STORE]))
    bookingApi.getPublicRoomTemplates.mockResolvedValue(ok([ROOM]))
    bookingApi.getBookingSlots.mockResolvedValue(ok({ slots: SLOTS }))
    bookingApi.getMyVouchersForBooking.mockResolvedValue(ok([]))
    bookingApi.getBookingQuote.mockResolvedValue(ok(QUOTE))
    getMyCredits.mockResolvedValue(ok([]))
  })
  afterEach(() => { vi.useRealTimers() })

  it('loads branches on mount', async () => {
    await mountBooking()
    expect(bookingApi.getPublicStores).toHaveBeenCalledOnce()
  })

  it('pre-fills branch and room from the query (RoomDetail "Booking" button)', async () => {
    const w = await mountBooking('/booking?store_id=s1&room_template_id=8')
    expect(bookingApi.getPublicRoomTemplates).toHaveBeenCalledWith('s1')
    expect(w.vm.form.storeId).toBe('s1')
    expect(w.vm.form.roomTemplateId).toBe(8)
  })

  it('changing the branch resets room, date and slots', async () => {
    const w = await mountBooking()
    await fillUntilSlots(w)
    w.vm.form.storeId = 's1'
    await w.vm.onStoreChange()
    expect(w.vm.form.roomTemplateId).toBe(0)
    expect(w.vm.form.date).toBe('')
    expect(w.vm.selectedSlots).toEqual([])
  })

  it('choosing a date loads slots and vouchers for that branch/room/date', async () => {
    const w = await mountBooking()
    await fillUntilSlots(w)
    expect(bookingApi.getBookingSlots).toHaveBeenCalledWith({ store_id: 's1', room_template_id: 8, date: '2026-10-08' })
    expect(bookingApi.getMyVouchersForBooking).toHaveBeenCalledWith({ store_id: 's1', room_template_id: 8 })
  })

  it('pays with QRIS: sends the exact payload and redirects to the invoice', async () => {
    bookingApi.initiateBooking.mockResolvedValue(ok({ invoice_url: 'https://checkout.xendit.co/web/1', hold_id: 'h1', expires_at: '2026-10-08T14:15:00+07:00' }))
    const w = await mountBooking()
    await fillUntilSlots(w)
    w.vm.form.paymentMethod = 'qris'
    await w.vm.handleBooking()
    expect(bookingApi.initiateBooking).toHaveBeenCalledWith({
      store_id: 's1', room_template_id: 8, booking_date: '2026-10-08',
      selected_slots: ['14:00', '15:00', '16:00'], payment_method: 'qris',
      voucher_id: undefined, credit_id: undefined,
    })
    expect(window.location.href).toBe('https://checkout.xendit.co/web/1')
    expect(sessionStorage.getItem('quantum_hold_id')).toBe('h1')
  })

  it('pays with play credits: goes straight to PaymentSuccess with the booking code', async () => {
    bookingApi.initiateBooking.mockResolvedValue(ok({ booking_code: 'BK-1' }))
    getMyCredits.mockResolvedValue(ok([{ id: 'c1', remaining_hours: 5, expires_at: '2027-01-01', is_active: true, package: { name: 'P' } }]))
    const w = await mountBooking()
    await fillUntilSlots(w)
    await flushPromises()
    w.vm.selectCredit({ id: 'c1' })
    await w.vm.handleBooking()
    await flushPromises() // router.push di handleBooking tidak di-await
    expect(bookingApi.initiateBooking).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'play_credits', credit_id: 'c1' }))
    expect(router.currentRoute.value.name).toBe('PaymentSuccess')
    expect(router.currentRoute.value.query.booking_code).toBe('BK-1')
  })

  it('shows the server error and re-enables paying when initiate fails', async () => {
    bookingApi.initiateBooking.mockRejectedValue({ response: { data: { message: 'Slot sudah dibooking' } } })
    const w = await mountBooking()
    await fillUntilSlots(w)
    w.vm.form.paymentMethod = 'qris'
    await w.vm.handleBooking()
    expect(toast.error).toHaveBeenCalledWith('Slot sudah dibooking')
    expect(w.vm.initiating).toBe(false)
  })
})
