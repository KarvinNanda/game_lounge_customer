import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/index', () => ({ default: { post: vi.fn() } }))

import { rememberPaymentExpiry } from '@/utils/payment'
import PaymentMockView from '@/views/PaymentMockView.vue'

const mountView = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }, { path: '/payment/mock', component: { template: '<div/>' } }],
  })
  await router.push('/payment/mock?type=credits&intent_id=i1&amount=50000')
  await router.isReady()
  const w = mount(PaymentMockView, { global: { plugins: [router] } })
  await flushPromises()
  return w
}

describe('PaymentMockView countdown', () => {
  beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }); vi.setSystemTime(new Date('2026-10-07T10:00:00Z')) })
  afterEach(() => { vi.useRealTimers() })

  it('counts down from expires_at (30 min for credits)', async () => {
    rememberPaymentExpiry('2026-10-07T10:30:00Z')
    const w = await mountView()
    expect(w.text()).toContain('30:00')
  })

  it('hides the countdown when expires_at is unknown', async () => {
    const w = await mountView()
    expect(w.text()).not.toContain('Sisa waktu pembayaran')
  })

  it('disables the pay button once the invoice has expired', async () => {
    rememberPaymentExpiry('2026-10-07T10:00:02Z')
    const w = await mountView()
    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(w.text()).toContain('Waktu Habis')
  })
})
