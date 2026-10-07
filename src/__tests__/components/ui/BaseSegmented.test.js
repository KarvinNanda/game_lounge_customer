import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'

const OPTS = [{ label: 'Semua', value: 'all' }, { label: 'Selesai', value: 'completed' }]

describe('BaseSegmented', () => {
  it('is a wrapping, labelled group of aria-pressed buttons (no scroll strip)', () => {
    const w = mount(BaseSegmented, { props: { options: OPTS, modelValue: 'all', label: 'Filter status' } })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Filter status')
    expect(w.classes()).toContain('flex-wrap')
    expect(w.findAll('button').map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false'])
  })
  it('emits update:modelValue', async () => {
    const w = mount(BaseSegmented, { props: { options: OPTS, modelValue: 'all', label: 'x' } })
    await w.findAll('button')[1].trigger('click')
    expect(w.emitted('update:modelValue')[0]).toEqual(['completed'])
  })
})
