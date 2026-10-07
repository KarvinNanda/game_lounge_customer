import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCard from '@/components/ui/BaseCard.vue'

describe('BaseCard', () => {
  it('renders a div with slot content', () => {
    const w = mount(BaseCard, { slots: { default: 'Isi' } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.text()).toBe('Isi')
  })
  it('adds hover/focus affordances only when interactive', () => {
    expect(mount(BaseCard).classes()).not.toContain('cursor-pointer')
    expect(mount(BaseCard, { props: { interactive: true } }).classes()).toContain('cursor-pointer')
  })
  it('renders the given tag', () => {
    expect(mount(BaseCard, { props: { tag: 'article' } }).element.tagName).toBe('ARTICLE')
  })
})
