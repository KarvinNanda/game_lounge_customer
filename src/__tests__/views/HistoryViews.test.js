import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/authApi', () => ({ getMyBookings: vi.fn(), getMyCredits: vi.fn() }))
vi.mock('@/api/fnbApi', () => ({ getMyFnbOrders: vi.fn() }))
import { getMyBookings, getMyCredits } from '@/api/authApi'
import { getMyFnbOrders } from '@/api/fnbApi'
import MyBookingsView from '@/views/MyBookingsView.vue'
import MyCreditsView from '@/views/MyCreditsView.vue'
import MyFnbOrdersView from '@/views/MyFnbOrdersView.vue'

const ok = (data) => ({ data: { data } })
const mountAt = async (component) => {
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/booking', '/credits', '/fnb-order', '/my-bookings'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push('/'); await router.isReady()
  const w = mount(component, { global: { plugins: [router] } })
  await flushPromises()
  return w
}

const BOOKING = { id: 7, booking_code: 'BK-7', status: 'ongoing', booking_date: '2026-10-08', start_time: '14:00:00', end_time: '17:00:00', total_price: 68000, store: { name: 'Bekasi' }, room: { room_template: { name: 'VIP' } } }

describe('MyBookingsView', () => {
  beforeEach(() => { vi.clearAllMocks(); getMyBookings.mockResolvedValue(ok([BOOKING])) })

  it('lists bookings with a status badge and no nested scroll area', async () => {
    const w = await mountAt(MyBookingsView)
    expect(w.find('h1').text()).toBe('My Bookings')
    expect(w.text()).toContain('BK-7')
    expect(w.text()).toContain('Sedang main')
    expect(w.text()).toContain('14:00–17:00')
    expect(w.text()).toContain('Rp 68.000')
    expect(w.html()).not.toMatch(/overflow-y-auto|overflow-x-auto/)
  })

  it('ongoing bookings link to F&B ordering with booking_id and room_info', async () => {
    const w = await mountAt(MyBookingsView)
    const href = w.find('a[href^="/fnb-order"]').attributes('href')
    const q = new URLSearchParams(href.split('?')[1]) // router encode spasi sebagai '+'
    expect(q.get('booking_id')).toBe('7')
    expect(q.get('room_info')).toBe('Bekasi — VIP')
  })

  it('filters by status and ignores a slower response from an older filter', async () => {
    let resolveOld
    const w = await mountAt(MyBookingsView)
    getMyBookings
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
      .mockResolvedValueOnce(ok([{ ...BOOKING, id: 9, booking_code: 'BK-DONE', status: 'completed' }]))
    const filter = w.find('[role="group"][aria-label="Filter status"]')
    await filter.findAll('button').find((b) => b.text() === 'Sedang main').trigger('click')
    await filter.findAll('button').find((b) => b.text() === 'Selesai').trigger('click')
    await flushPromises()
    resolveOld(ok([BOOKING])); await flushPromises()
    expect(getMyBookings).toHaveBeenLastCalledWith({ status: 'completed' })
    expect(w.text()).toContain('BK-DONE')
    expect(w.text()).not.toContain('BK-7')
  })

  it('empty state links to booking', async () => {
    getMyBookings.mockResolvedValue(ok([]))
    const w = await mountAt(MyBookingsView)
    expect(w.text()).toContain('Belum ada booking')
    expect(w.find('a[href="/booking"]').exists()).toBe(true)
  })
})

describe('MyCreditsView', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 8, 12)) })
  afterEach(() => { vi.useRealTimers() })

  it('shows expired credits as expired, not as a negative countdown', async () => {
    getMyCredits.mockResolvedValue(ok([{ id: 1, package: { name: 'Paket Lama' }, remaining_hours: 2, used_hours: 8, total_hours: 10, expires_at: '2026-10-01T00:00:00+07:00' }]))
    const w = await mountAt(MyCreditsView)
    expect(w.text()).toContain('Kedaluwarsa')
    expect(w.text()).not.toMatch(/-\d+/)
  })

  it('shows days left for credits expiring soon and a usage progressbar', async () => {
    getMyCredits.mockResolvedValue(ok([{ id: 1, package: { name: 'Paket 10' }, remaining_hours: 4, used_hours: 6, total_hours: 10, expires_at: '2026-10-11T12:00:00+07:00' }]))
    const w = await mountAt(MyCreditsView)
    expect(w.text()).toContain('3 hari lagi')
    const bar = w.find('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('6')
    expect(bar.attributes('aria-valuemax')).toBe('10')
  })

  it('empty state links to buying credits', async () => {
    getMyCredits.mockResolvedValue(ok([]))
    const w = await mountAt(MyCreditsView)
    expect(w.find('a[href="/credits"]').exists()).toBe(true)
  })
})

describe('MyFnbOrdersView', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('lists orders with status badge, items and total', async () => {
    getMyFnbOrders.mockResolvedValue(ok([{ id: 1, status: 'preparing', created_at: '2026-10-08T14:05:00+07:00', total_amount: 31000, notes: 'tanpa es',
      items: [{ id: 1, item_name: 'Es Teh', quantity: 2, price: 8000 }, { id: 2, item_name: 'Kopi', quantity: 1, price: 15000 }] }]))
    const w = await mountAt(MyFnbOrdersView)
    expect(w.text()).toContain('Disiapkan')
    expect(w.text()).toContain('2× Es Teh')
    expect(w.text()).toContain('Rp 31.000')
    expect(w.text()).toContain('tanpa es')
  })

  it('empty state', async () => {
    getMyFnbOrders.mockResolvedValue(ok([]))
    const w = await mountAt(MyFnbOrdersView)
    expect(w.text()).toContain('Belum ada pesanan')
  })
})
