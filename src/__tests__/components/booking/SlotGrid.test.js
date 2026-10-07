import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SlotGrid from '@/components/booking/SlotGrid.vue'

const SLOTS = [
  { start_time: '14:00', end_time: '15:00', available: true },
  { start_time: '15:00', end_time: '16:00', available: true },
  { start_time: '16:00', end_time: '17:00', available: false },
]
const mk = (props) => mount(SlotGrid, { props: { slots: SLOTS, selected: [], hours: '10:00 – 23:00', ...props } })

describe('SlotGrid', () => {
  it('renders toggle chips with aria-pressed and disables full slots', () => {
    const w = mk({ selected: ['14:00'] })
    const chips = w.findAll('[data-slot]')
    expect(chips).toHaveLength(3)
    expect(chips[0].attributes('aria-pressed')).toBe('true')
    expect(chips[1].attributes('aria-pressed')).toBe('false')
    expect(chips[2].attributes('disabled')).toBeDefined()
    expect(chips[2].text()).toContain('penuh')
  })
  it('emits toggle with the start time', async () => {
    const w = mk()
    await w.findAll('[data-slot]')[1].trigger('click')
    expect(w.emitted('toggle')[0]).toEqual(['15:00'])
  })
  it('summarizes the selected range and can clear it', async () => {
    const w = mk({ selected: ['14:00', '15:00'] })
    expect(w.text()).toContain('14:00–16:00')
    expect(w.text()).toContain('2 jam')
    await w.find('[data-clear]').trigger('click')
    expect(w.emitted('clear')).toHaveLength(1)
  })
  it('shows skeletons while loading and an empty message when no slots', () => {
    expect(mk({ loading: true, slots: [] }).findAll('.skeleton').length).toBeGreaterThan(0)
    expect(mk({ slots: [] }).text()).toContain('Tidak ada slot tersedia')
  })
})
