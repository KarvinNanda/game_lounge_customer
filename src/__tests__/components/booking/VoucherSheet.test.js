import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VoucherSheet from '@/components/booking/VoucherSheet.vue'

const V = [{ voucher_id: 'v1', name: 'Hemat 10%', code: 'H10', discount_type: 'percentage', discount_value: 10, min_purchase: 50000 }]
let w
afterEach(() => { w?.unmount() })

describe('VoucherSheet', () => {
  it('lists "Tidak pakai voucher" plus vouchers and emits select + close', async () => {
    w = mount(VoucherSheet, { props: { modelValue: true, vouchers: V, selected: null }, attachTo: document.body })
    await nextTick()
    const options = [...document.body.querySelectorAll('[role="radio"]')]
    expect(options.map((o) => o.textContent)).toEqual([expect.stringContaining('Tidak pakai voucher'), expect.stringContaining('Hemat 10%')])
    expect(options[0].getAttribute('aria-checked')).toBe('true')
    options[1].click()
    expect(w.emitted('select')[0]).toEqual([V[0]])
    expect(w.emitted('update:modelValue')[0]).toEqual([false])
    expect(document.body.textContent).toContain('min Rp 50.000')
  })
})
