import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({
  getCustomerMe: vi.fn(),
  getMyCredits:  vi.fn().mockResolvedValue({ data: { data: [] } }),
}))
vi.mock('@/api/bookingApi', () => ({
  getPublicStores:         vi.fn().mockResolvedValue({ data: { data: [] } }),
  getPublicRoomTemplates:  vi.fn().mockResolvedValue({ data: { data: [] } }),
  getBookingSlots:         vi.fn().mockResolvedValue({ data: { data: [] } }),
  getMyVouchersForBooking: vi.fn().mockResolvedValue({ data: { data: [] } }),
  initiateBooking:         vi.fn(),
  getBookingQuote:         vi.fn(),
}))

import { getBookingQuote } from '@/api/bookingApi'
import BookingView from '@/views/BookingView.vue'

const QUOTE = {
  available: true, base_price: 68000, flash_discount: 0, total_price: 68000, has_flash_sale: false,
  breakdown: [{ time_range: '14:00 - 17:00', type: 'Normal Hour', description: 'Paket 3 Jam', amount: 68000 }],
}

// Mount lalu isi state sampai tahap pembayaran (tanpa klik UI pilih cabang/ruangan/tanggal)
const mountAtPayment = async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'Alice', type: 'member' })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }, { path: '/booking', component: { template: '<div/>' } }],
  })
  await router.push('/booking'); await router.isReady()
  const w = mount(BookingView, { global: { plugins: [router, pinia] } })
  await flushPromises()

  w.vm.form.storeId        = 'store-1'
  w.vm.form.roomTemplateId = 8
  w.vm.form.date           = '2026-10-08'
  w.vm.form.paymentMethod  = 'qris'
  w.vm.selectedSlots       = ['14:00', '15:00', '16:00']
  await nextTick()
  return w
}

const payButton = (w) => w.findAll('button').find((b) => b.text().includes('Bayar Sekarang') || b.text().includes('Memproses'))
const settleQuote = async () => { vi.advanceTimersByTime(250); await flushPromises() }

describe('BookingView price quote wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => { vi.useRealTimers() })

  it('requests the quote with the selected branch, room, date and slots', async () => {
    getBookingQuote.mockResolvedValue({ data: { data: QUOTE } })
    await mountAtPayment()
    await settleQuote()
    expect(getBookingQuote).toHaveBeenLastCalledWith({
      store_id: 'store-1', room_template_id: 8, booking_date: '2026-10-08',
      selected_slots: ['14:00', '15:00', '16:00'],
    })
  })

  it('shows the server total and enables Bayar once the quote is ready', async () => {
    getBookingQuote.mockResolvedValue({ data: { data: QUOTE } })
    const w = await mountAtPayment()
    expect(payButton(w).attributes('disabled')).toBeDefined()   // masih loading
    await settleQuote()
    expect(w.text()).toContain('Paket 3 Jam')
    expect(w.find('[data-total]').text()).toContain('Rp 68.000')
    expect(payButton(w).attributes('disabled')).toBeUndefined()
  })

  it('disables Bayar and shows the server message when the quote fails', async () => {
    getBookingQuote.mockRejectedValue({ response: { status: 400, data: { message: 'Di luar jam operasional' } } })
    const w = await mountAtPayment()
    await settleQuote()
    expect(w.text()).toContain('Di luar jam operasional')
    expect(payButton(w).attributes('disabled')).toBeDefined()
  })

  it('disables Bayar when the slots are no longer available', async () => {
    getBookingQuote.mockResolvedValue({ data: { data: { ...QUOTE, available: false } } })
    const w = await mountAtPayment()
    await settleQuote()
    expect(w.text()).toContain('Slot sudah tidak tersedia')
    expect(payButton(w).attributes('disabled')).toBeDefined()
  })

  it('bases the voucher estimate on the server total', async () => {
    getBookingQuote.mockResolvedValue({ data: { data: QUOTE } })
    const w = await mountAtPayment()
    await settleQuote()
    w.vm.onSelectVoucher({ voucher_id: 'v1', code: 'HEMAT10', discount_type: 'percentage', discount_value: 10 })
    await nextTick()
    expect(w.text()).toContain('- Rp 6.800')
    expect(w.find('[data-total]').text()).toContain('Rp 61.200')
  })

  it('keeps slot selection consecutive and tells the user when it restarts', async () => {
    getBookingQuote.mockResolvedValue({ data: { data: QUOTE } })
    const w = await mountAtPayment()
    w.vm.selectedSlots = []
    w.vm.hourlySlots = ['10:00', '11:00', '12:00', '14:00'].map((t) => ({ start_time: t, available: true, price: 20000 }))
    w.vm.toggleSlot('10:00')
    w.vm.toggleSlot('11:00')
    expect(w.vm.selectedSlots).toEqual(['10:00', '11:00'])
    w.vm.toggleSlot('14:00')
    expect(w.vm.selectedSlots).toEqual(['14:00'])
    expect(toast.info).toHaveBeenCalledWith('Slot harus berurutan, pilihan dimulai ulang')
  })

  it('ignores taps on unavailable slots', async () => {
    getBookingQuote.mockResolvedValue({ data: { data: QUOTE } })
    const w = await mountAtPayment()
    w.vm.selectedSlots = []
    w.vm.hourlySlots = [{ start_time: '10:00', available: false, price: 20000 }]
    w.vm.toggleSlot('10:00')
    expect(w.vm.selectedSlots).toEqual([])
  })
})
