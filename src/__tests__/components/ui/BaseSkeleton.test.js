import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

describe('BaseSkeleton', () => {
  it('is hidden from screen readers and uses the shimmer class', () => {
    const w = mount(BaseSkeleton)
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.classes()).toContain('skeleton')
  })
})
