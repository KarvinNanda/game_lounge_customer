import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import PaymentStep from '@/components/booking/PaymentStep.vue'

const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/credits'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
const CREDIT = { id: 'c1', remaining_hours: 5, expires_at: '2027-01-01', package: { name: 'Paket 10 Jam' } }
const base = { loggedIn: true, loadingCredits: false, validCredits: [], selectedCreditId: '', hasExpiredCredits: false, bookingDate: '2026-10-08', vouchers: [], selectedVoucher: null, paymentMethod: '' }
const mk = (props) => mount(PaymentStep, { props: { ...base, ...props }, global: { plugins: [router] } })

describe('PaymentStep', () => {
  it('payment methods are a radio group and emit update:paymentMethod', async () => {
    const w = mk()
    const radios = w.findAll('[role="radiogroup"][aria-label="Metode pembayaran"] [role="radio"]')
    expect(radios).toHaveLength(4)
    await radios[0].trigger('click')
    expect(w.emitted('update:paymentMethod')[0]).toEqual(['qris'])
  })
  it('lists valid credits and emits select-credit; hides methods when a credit is chosen', async () => {
    const w = mk({ validCredits: [CREDIT] })
    expect(w.text()).toContain('Paket 10 Jam')
    await w.find('[data-credit]').trigger('click')
    expect(w.emitted('select-credit')[0]).toEqual([CREDIT])
    expect(mk({ validCredits: [CREDIT], selectedCreditId: 'c1' }).find('[aria-label="Metode pembayaran"]').exists()).toBe(false)
  })
  it('warns when credits exist but are not valid for this booking', () => {
    expect(mk({ hasExpiredCredits: true }).find('[role="note"]').text()).toContain('tidak berlaku')
  })
  it('voucher row opens the sheet; a chosen voucher can be removed', async () => {
    const w = mk({ vouchers: [{ voucher_id: 'v1' }] })
    await w.find('[data-voucher-open]').trigger('click')
    expect(w.emitted('open-vouchers')).toHaveLength(1)
    const w2 = mk({ vouchers: [{ voucher_id: 'v1' }], selectedVoucher: { voucher_id: 'v1', name: 'Hemat', code: 'H10', discount_type: 'percentage', discount_value: 10 } })
    await w2.find('button[aria-label="Hapus voucher H10"]').trigger('click')
    expect(w2.emitted('clear-voucher')).toHaveLength(1)
  })
})
