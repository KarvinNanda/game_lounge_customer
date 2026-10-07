import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const toast = { success: vi.fn(), error: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/bookingApi', () => ({ getMyBookings: vi.fn(), getBookingByHold: vi.fn() }))
import { getMyBookings, getBookingByHold } from '@/api/bookingApi'
const HOLD = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'
import PaymentSuccessView from '@/views/PaymentSuccessView.vue'
import PaymentFailedView from '@/views/PaymentFailedView.vue'

const at = async (component, url) => {
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/booking', '/credits', '/payment/success', '/payment/failed', '/my-bookings'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push(url); await router.isReady()
  const w = mount(component, { global: { plugins: [router] } })
  await flushPromises()
  return w
}

describe('PaymentSuccessView', () => {
  beforeEach(() => { vi.clearAllMocks(); getMyBookings.mockResolvedValue({ data: { data: [{ booking_code: 'BK-LATEST' }] } }) })

  it('uses booking_code from the URL (play credits flow) without refetching', async () => {
    const w = await at(PaymentSuccessView, '/payment/success?booking_code=BK-123')
    expect(w.text()).toContain('BK-123')
    expect(getMyBookings).not.toHaveBeenCalled()
    expect(w.find('[role="status"]').exists()).toBe(true)
  })

  it('after a gateway redirect it never guesses from the bookings list', async () => {
    // List backend diurutkan menurut jadwal, bukan waktu bayar → "booking teratas" bisa booking lain
    getBookingByHold.mockResolvedValue({ data: { data: { status: 'pending' } } })
    await at(PaymentSuccessView, `/payment/success?hold_id=${HOLD}`)
    expect(getMyBookings).not.toHaveBeenCalled()
  })

  it('shows a waiting state, then the code once the hold is confirmed', async () => {
    let resolve
    getBookingByHold.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const w = await at(PaymentSuccessView, `/payment/success?hold_id=${HOLD}`)
    expect(getBookingByHold).toHaveBeenCalledWith(HOLD)
    expect(w.text()).toContain('Mengonfirmasi pembayaran')
    resolve({ data: { data: { status: 'confirmed', booking_code: 'BK-0042' } } }); await flushPromises()
    expect(w.text()).toContain('BK-0042')
    expect(w.findAll('button').some((b) => b.text().includes('Salin'))).toBe(true)
  })

  it('an invalid hold id points to My Bookings without calling the API', async () => {
    const w = await at(PaymentSuccessView, '/payment/success?hold_id=h1')
    expect(getBookingByHold).not.toHaveBeenCalled()
    expect(w.text()).toContain('My Bookings')
    expect(w.text()).not.toContain('Mengonfirmasi pembayaran')
    expect(w.findAll('button').some((b) => b.text().includes('Salin'))).toBe(false)
    expect(w.find('a[href="/my-bookings"]').exists()).toBe(true)
  })

  it('a code already in the URL (mock payment) is used without polling', async () => {
    await at(PaymentSuccessView, `/payment/success?booking_code=BK-123&hold_id=${HOLD}`)
    expect(getBookingByHold).not.toHaveBeenCalled()
  })

  it('event bookings show the event name, not a booking code', async () => {
    const w = await at(PaymentSuccessView, '/payment/success?type=event&event_name=Ulang%20Tahun')
    expect(w.text()).toContain('Ulang Tahun')
    expect(w.text()).not.toContain('Kode Booking')
    expect(getMyBookings).not.toHaveBeenCalled()
  })

  it('copy button copies the code', async () => {
    const w = await at(PaymentSuccessView, '/payment/success?booking_code=BK-123')
    await w.findAll('button').find((b) => b.text().includes('Salin')).trigger('click'); await flushPromises()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('BK-123')
  })
})

describe('PaymentSuccessView untrusted query', () => {
  beforeEach(() => { vi.clearAllMocks(); getMyBookings.mockResolvedValue({ data: { data: [{ booking_code: 'BK-REAL' }] } }) })

  it('ignores a booking_code that is not a booking code and shows no code at all', async () => {
    const w = await at(PaymentSuccessView, '/payment/success?booking_code=' + encodeURIComponent('HUBUNGI WA 0812-xxx untuk refund'))
    expect(w.text()).not.toContain('HUBUNGI')
    expect(w.text()).not.toContain('BK-REAL')
    expect(w.text()).toContain('My Bookings')
  })

  it('caps event_name and ignores array params', async () => {
    const long = 'A'.repeat(200)
    const w = await at(PaymentSuccessView, `/payment/success?type=event&event_name=${long}`)
    expect(w.text()).not.toContain(long)
    const w2 = await at(PaymentSuccessView, '/payment/success?type=event&event_name=a&event_name=b')
    expect(w2.text()).not.toContain('a,b')
  })
})

describe('PaymentFailedView', () => {
  it('is an error result with retry and home links', async () => {
    const w = await at(PaymentFailedView, '/payment/failed')
    expect(w.find('[role="alert"]').exists()).toBe(true)
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/booking', '/']))
  })
})

import CreditsFailedView from '@/views/CreditsFailedView.vue'
describe('CreditsFailedView', () => {
  it('is an error result with retry (credits) and home links', async () => {
    const w = await at(CreditsFailedView, '/payment/failed')
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.findAll('a').map((a) => a.attributes('href'))).toEqual(expect.arrayContaining(['/credits', '/']))
  })
})
