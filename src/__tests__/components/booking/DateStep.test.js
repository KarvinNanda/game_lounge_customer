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
  it('renders a 7-day strip from min with full-date aria-labels', () => {
    const w = mount(DateStep, { props: { modelValue: '2026-10-22', min: '2026-10-20' } })
    const days = w.findAll('[data-day]')
    expect(days).toHaveLength(7)
    expect(days[0].text()).toContain('Hari ini')
    expect(days[1].text()).toContain('Besok')
    expect(days[6].text()).toContain('26')
    expect(days[2].attributes('aria-label')).toBe('Kamis, 22 Oktober 2026')
    expect(days[2].attributes('aria-pressed')).toBe('true')
  })
  it('shows a picked date outside the strip on the calendar cell', () => {
    const w = mount(DateStep, { props: { modelValue: '2026-11-15', min: '2026-10-20' } })
    expect(w.findAll('[data-day][aria-pressed="true"]')).toHaveLength(0)
    const cal = w.find('[data-calendar]')
    expect(cal.attributes('aria-pressed')).toBe('true')
    expect(cal.text()).toContain('15')
  })
  it('phone: the strip wraps to 4 columns so every cell can be ≥ 44px wide', () => {
    const w = mount(DateStep, { props: { modelValue: '', min: '2026-10-20' } })
    expect(w.find('[data-day]').element.parentElement.className).toMatch(/(^|\s)grid-cols-4(\s|$)/)
  })
  it('accessible names start with the visible label (label in name)', () => {
    const w = mount(DateStep, { props: { modelValue: '', min: '2026-10-20' } })
    const days = w.findAll('[data-day]')
    expect(days[0].attributes('aria-label')).toBe('Hari ini, Selasa, 20 Oktober 2026')
    expect(days[1].attributes('aria-label')).toBe('Besok, Rabu, 21 Oktober 2026')
  })
})

