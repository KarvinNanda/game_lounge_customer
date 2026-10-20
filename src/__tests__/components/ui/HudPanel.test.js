import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HudPanel from '@/components/ui/HudPanel.vue'
import HudLabel from '@/components/ui/HudLabel.vue'

describe('HudPanel', () => {
  it('keeps the focusable element outside the clipped face', () => {
    const w = mount(HudPanel, { props: { interactive: true, tag: 'button' }, slots: { default: 'Isi' } })
    expect(w.element.matches('a,button,[tabindex]')).toBe(true)
    const face = w.find('.hud-cut')
    expect(face.exists()).toBe(true)
    expect(face.element).not.toBe(w.element)
    expect(w.classes()).not.toContain('hud-cut')
  })
  it('renders two decorative corner brackets when asked', () => {
    const w = mount(HudPanel, { props: { brackets: true } })
    const brackets = w.findAll('[data-bracket]')
    expect(brackets).toHaveLength(2)
    brackets.forEach((b) => expect(b.attributes('aria-hidden')).toBe('true'))
  })
  it('exposes the tone for styling and tests', () => {
    expect(mount(HudPanel, { props: { tone: 'active' } }).attributes('data-tone')).toBe('active')
  })
  it('cut="none" renders no clipped face', () => {
    expect(mount(HudPanel, { props: { cut: 'none' } }).find('.hud-cut, .hud-cut-sm').exists()).toBe(false)
  })
})

describe('HudLabel', () => {
  it('renders a small mono label in the given tag', () => {
    const w = mount(HudLabel, { props: { tag: 'p', tone: 'accent' }, slots: { default: 'NEXT SESSION' } })
    expect(w.element.tagName).toBe('P')
    expect(w.classes()).toContain('hud-label')
    expect(w.text()).toBe('NEXT SESSION')
  })
})
