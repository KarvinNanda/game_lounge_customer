import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))
vi.mock('@/api/bookingApi', () => ({ getPublicStores: vi.fn() }))
vi.mock('@/api/playCreditsApi', () => ({ getPlayCreditsPackages: vi.fn(), initiatePlayCreditsPurchase: vi.fn() }))

import { getPublicStores } from '@/api/bookingApi'
import { getPlayCreditsPackages, initiatePlayCreditsPurchase } from '@/api/playCreditsApi'
import CreditsView from '@/views/CreditsView.vue'

const ok = (data) => ({ data: { data } })
const PKGS = [
  { id: 'p1', name: 'Paket 5 Jam',  total_hours: 5,  validity_days: 30, price: 100000 },
  { id: 'p2', name: 'Paket 10 Jam', total_hours: 10, validity_days: 60, price: 180000, is_best_value: true },
]

const mountView = async () => {
  const pinia = createPinia(); setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'A' })
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/credits'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push('/credits'); await router.isReady()
  const w = mount(CreditsView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}
const radio = (w, label) => w.findAll('[role="radio"]').find((r) => r.text().includes(label))
const payBtn = (w) => w.find('[data-pay-bar] button')
const choose = async (w) => {
  await radio(w, 'Bekasi').trigger('click'); await flushPromises()
  await radio(w, 'Paket 10 Jam').trigger('click'); await flushPromises()
  await radio(w, 'QRIS').trigger('click'); await flushPromises()
}

describe('CreditsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
    getPublicStores.mockResolvedValue(ok([{ id: 's1', name: 'Bekasi' }]))
    getPlayCreditsPackages.mockResolvedValue(ok(PKGS))
  })

  it('branch → packages → payment as an accordion, with per-hour price and best value badge', async () => {
    const w = await mountView()
    await radio(w, 'Bekasi').trigger('click'); await flushPromises()
    expect(getPlayCreditsPackages).toHaveBeenCalledWith('s1')
    expect(w.findAll('section[data-step]')[0].text()).toContain('Bekasi')
    expect(radio(w, 'Paket 10 Jam').text()).toContain('Rp 18.000')
    expect(radio(w, 'Paket 10 Jam').text()).toContain('Terbaik')
  })

  it('sends the purchase payload and redirects to the invoice', async () => {
    initiatePlayCreditsPurchase.mockResolvedValue(ok({ invoice_url: 'https://checkout.xendit.co/web/9', intent_id: 'i9', expires_at: '2026-10-08T12:30:00+07:00' }))
    const w = await mountView()
    await choose(w)
    expect(w.find('[data-pay-bar]').text()).toContain('Rp 180.000')
    await payBtn(w).trigger('click'); await flushPromises()
    expect(initiatePlayCreditsPurchase).toHaveBeenCalledWith({ package_id: 'p2', store_id: 's1', payment_method: 'qris' })
    expect(window.location.href).toBe('https://checkout.xendit.co/web/9')
  })

  it('does not get stuck on "Memproses" when the backend returns no invoice_url', async () => {
    initiatePlayCreditsPurchase.mockResolvedValue(ok({ intent_id: 'i9' }))
    const w = await mountView()
    await choose(w)
    await payBtn(w).trigger('click'); await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain('Link pembayaran tidak tersedia')
    expect(payBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('shows the server error and re-enables paying when initiate fails', async () => {
    initiatePlayCreditsPurchase.mockRejectedValue({ response: { data: { message: 'Paket tidak aktif' } } })
    const w = await mountView()
    await choose(w)
    await payBtn(w).trigger('click'); await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain('Paket tidak aktif')
    expect(payBtn(w).attributes('disabled')).toBeUndefined()
  })
})
