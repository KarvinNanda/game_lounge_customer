import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/api/playCreditsApi', () => ({
  mockConfirmPlayCredits: vi.fn().mockResolvedValue({ data: { data: { package_name: 'Paket 10 Jam', total_hours: 10, validity_days: 30 } } }),
}))

import { mockConfirmPlayCredits } from '@/api/playCreditsApi'
import CreditsSuccessView from '@/views/CreditsSuccessView.vue'

const mountView = async (url = '/credits/success') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/credits/success', '/my-credits'].map((p) => ({ path: p, component: { template: '<div/>' } })),
  })
  await router.push(url)
  await router.isReady()
  const w = mount(CreditsSuccessView, { global: { plugins: [router] } })
  await flushPromises()
  return w
}

describe('CreditsSuccessView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    sessionStorage.setItem('quantum_intent_id', 'intent-1') // selalu di-set sebelum redirect ke Xendit
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it('does NOT call mock-confirm when mock payment is off (production)', async () => {
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', 'false')
    const w = await mountView('/credits/success?package_name=Paket%205&total_hours=5')
    expect(mockConfirmPlayCredits).not.toHaveBeenCalled()
    expect(w.text()).toContain('Pembelian Berhasil')
    expect(w.text()).toContain('Paket 5')
    expect(sessionStorage.getItem('quantum_intent_id')).toBeNull()
  })

  it('calls mock-confirm when mock payment is on and the mock flow put intent_id in the URL (dev)', async () => {
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', 'true')
    const w = await mountView('/credits/success?intent_id=intent-1')
    expect(mockConfirmPlayCredits).toHaveBeenCalledWith('intent-1')
    expect(w.text()).toContain('Paket 10 Jam')
  })

  it('does NOT call mock-confirm on a real Xendit return even when the mock flag is on (staging)', async () => {
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', 'true')
    // Xendit asli: intent hanya ada di sessionStorage, tidak di URL
    await mountView('/credits/success?package_name=Paket%205')
    expect(mockConfirmPlayCredits).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('quantum_intent_id')).toBeNull()
  })
})
