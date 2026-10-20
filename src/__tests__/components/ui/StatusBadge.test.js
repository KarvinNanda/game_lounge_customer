import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/ui/StatusBadge.vue'

describe('StatusBadge', () => {
  it.each([
    ['booking', 'ongoing', 'Sedang main', 'success'],
    ['booking', 'cancelled', 'Dibatalkan', 'danger'],
    ['fnb', 'preparing', 'Disiapkan', 'info'],
    ['fnb', 'delivered', 'Diantar', 'success'],
  ])('%s %s → %s', (kind, status, label, tone) => {
    const w = mount(StatusBadge, { props: { kind, status } })
    expect(w.text()).toBe(label)
    expect(w.attributes('data-tone')).toBe(tone)
  })
  it('ongoing shows an icon next to the label (not color alone)', () => {
    const w = mount(StatusBadge, { props: { kind: 'booking', status: 'ongoing' } })
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.text()).toBe('Sedang main')
  })
  it('falls back to the raw status with a neutral tone', () => {
    const w = mount(StatusBadge, { props: { kind: 'booking', status: 'weird' } })
    expect(w.text()).toBe('weird')
    expect(w.attributes('data-tone')).toBe('neutral')
  })
})
