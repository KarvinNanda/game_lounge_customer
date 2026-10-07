import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BranchStep from '@/components/booking/BranchStep.vue'

const STORES = [
  { id: 's1', name: 'Bekasi', address: 'Jl. A', operating_hours: [{ open_time: '10:00:00', close_time: '23:00:00' }], link_gmaps: 'https://maps.app/x' },
  { id: 's2', name: 'Depok', address: 'Jl. B' },
]

describe('BranchStep', () => {
  it('renders a radio group and marks the selected branch', () => {
    const w = mount(BranchStep, { props: { stores: STORES, modelValue: 's2' } })
    expect(w.find('[role="radiogroup"]').exists()).toBe(true)
    const radios = w.findAll('[role="radio"]')
    expect(radios).toHaveLength(2)
    expect(radios[1].attributes('aria-checked')).toBe('true')
    expect(w.text()).toContain('10:00 – 23:00')
  })
  it('emits select with the branch id', async () => {
    const w = mount(BranchStep, { props: { stores: STORES, modelValue: '' } })
    await w.findAll('[role="radio"]')[0].trigger('click')
    expect(w.emitted('select')[0]).toEqual(['s1'])
  })
  it('opens Maps safely in a new tab', () => {
    const a = mount(BranchStep, { props: { stores: STORES, modelValue: '' } }).find('a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toBe('noopener noreferrer')
  })
})
