import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaymentMethodPicker from '@/components/booking/PaymentMethodPicker.vue'

describe('PaymentMethodPicker', () => {
  it('is a labelled radio group of the 4 gateway methods with svg icons', () => {
    const w = mount(PaymentMethodPicker, { props: { modelValue: 'va' } })
    const group = w.find('[role="radiogroup"][aria-label="Metode pembayaran"]')
    const radios = group.findAll('[role="radio"]')
    expect(radios.map((r) => r.text())).toEqual([
      expect.stringContaining('QRIS'), expect.stringContaining('E-Wallet'),
      expect.stringContaining('Virtual Account'), expect.stringContaining('Kartu'),
    ])
    expect(radios[2].attributes('aria-checked')).toBe('true')
    expect(group.findAll('svg')).toHaveLength(4)
  })
  it('emits update:modelValue', async () => {
    const w = mount(PaymentMethodPicker, { props: { modelValue: '' } })
    await w.findAll('[role="radio"]')[1].trigger('click')
    expect(w.emitted('update:modelValue')[0]).toEqual(['ewallet'])
  })

  it('has a single Tab stop and arrow keys change the selection', async () => {
    const w = mount(PaymentMethodPicker, { props: { modelValue: 'qris' }, attachTo: document.body })
    const radios = w.findAll('[role="radio"]')
    expect(radios.map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    radios[0].element.focus()
    await radios[0].trigger('keydown', { key: 'ArrowRight' }) // dari radio yang fokus (bubble ke grup)
    expect(w.emitted('update:modelValue').at(-1)).toEqual(['ewallet'])
    w.unmount()
  })
})
