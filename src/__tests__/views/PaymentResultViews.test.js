import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const toast = { success: vi.fn(), error: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/bookingApi', () => ({ getMyBookings: vi.fn() }))
import { getMyBookings } from '@/api/bookingApi'
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

  it('falls back to the latest booking after a gateway redirect', async () => {
    const w = await at(PaymentSuccessView, '/payment/success')
    expect(w.text()).toContain('BK-LATEST')
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

  it('ignores a booking_code that is not a booking code and loads the real one', async () => {
    const w = await at(PaymentSuccessView, '/payment/success?booking_code=' + encodeURIComponent('HUBUNGI WA 0812-xxx untuk refund'))
    expect(w.text()).not.toContain('HUBUNGI')
    expect(w.text()).toContain('BK-REAL')
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
