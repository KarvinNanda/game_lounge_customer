import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseBadge from '@/components/ui/BaseBadge.vue'

describe('BaseBadge', () => {
  it('renders slot text', () => {
    expect(mount(BaseBadge, { slots: { default: 'Favorit' } }).text()).toBe('Favorit')
  })
  it('applies the gold tone', () => {
    expect(mount(BaseBadge, { props: { tone: 'gold' } }).classes()).toContain('bg-q-gold')
  })
})
