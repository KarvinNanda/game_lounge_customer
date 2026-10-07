import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DateStep from '@/components/booking/DateStep.vue'

describe('DateStep', () => {
  it('binds a labelled date input with min = today', () => {
    const w = mount(DateStep, { props: { modelValue: '', min: '2026-10-08' } })
    const input = w.find('input[type="date"]')
    expect(input.attributes('min')).toBe('2026-10-08')
    expect(w.find(`label[for="${input.attributes('id')}"]`).exists()).toBe(true)
  })
  it('"Hari ini" and "Besok" chips emit the right dates', async () => {
    const w = mount(DateStep, { props: { modelValue: '', min: '2026-10-31' } })
    const [todayBtn, tomorrowBtn] = w.findAll('button')
    await todayBtn.trigger('click')
    await tomorrowBtn.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['2026-10-31'], ['2026-11-01']])
  })
  it('typing a date emits it', async () => {
    const w = mount(DateStep, { props: { modelValue: '', min: '2026-10-08' } })
    await w.find('input').setValue('2026-10-10')
    expect(w.emitted('update:modelValue').at(-1)).toEqual(['2026-10-10'])
  })
})
