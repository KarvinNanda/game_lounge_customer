import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FlowProgress from '@/components/flow/FlowProgress.vue'

describe('FlowProgress', () => {
  it('is an accessible progressbar with n/N text', () => {
    const w = mount(FlowProgress, { props: { current: 2, count: 4 } })
    const bar = w.find('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('2')
    expect(bar.attributes('aria-valuemax')).toBe('4')
    expect(bar.attributes('aria-valuetext')).toBe('2 dari 4 langkah')
    expect(w.text()).toContain('2/4')
    expect(w.findAll('[data-segment]')).toHaveLength(4)
    expect(w.findAll('[data-segment][data-done]')).toHaveLength(2)
  })

  it('says READY when all steps are done', () => {
    expect(mount(FlowProgress, { props: { current: 4, count: 4 } }).text()).toContain('READY')
  })
})
