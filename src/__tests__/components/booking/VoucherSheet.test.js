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

describe('VoucherSheet: reserved vouchers', () => {
  const LOCKED = { voucher_id: 'v2', name: 'VIP Weekend 15%', code: 'VIPWKND', discount_type: 'percentage', discount_value: 15, min_purchase: 0, reserved_until: '2026-11-16T20:32:10+07:00', hold_id: 'h1' }

  it('shows a reserved voucher as locked: visible, not selectable, with the unlock time', async () => {
    w = mount(VoucherSheet, { props: { modelValue: true, vouchers: [V[0], LOCKED], selected: null }, attachTo: document.body })
    await nextTick()
    const row = [...document.body.querySelectorAll('[role="radio"]')].find((o) => o.textContent.includes('VIP Weekend'))
    expect(row.disabled).toBe(true)
    expect(row.hasAttribute('data-reserved')).toBe(true)
    expect(row.textContent).toContain('TERKUNCI S/D 20:32')
    row.click()
    expect(w.emitted('select')).toBeUndefined()
  })

  it('counts usable and locked vouchers separately in the description', async () => {
    w = mount(VoucherSheet, { props: { modelValue: true, vouchers: [V[0], LOCKED], selected: null }, attachTo: document.body })
    await nextTick()
    expect(document.body.textContent).toContain('1 voucher tersedia · 1 dikunci pembayaran lain')
  })

  it('keeps "Rp" and the amount of the minimum purchase on one line', async () => {
    w = mount(VoucherSheet, { props: { modelValue: true, vouchers: [{ ...LOCKED, min_purchase: 50000 }], selected: null }, attachTo: document.body })
    await nextTick()
    const min = [...document.body.querySelectorAll('.whitespace-nowrap')].find((el) => el.textContent.includes('min Rp 50.000'))
    expect(min).toBeTruthy()
  })
})

