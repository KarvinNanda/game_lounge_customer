import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/',  component: { template: '<div/>' } },
    { path: '/x', component: { template: '<div/>' } },
  ],
})
const mountBtn = (props = {}, slot = 'Simpan') =>
  mount(BaseButton, { props, slots: { default: slot }, global: { plugins: [router] } })

describe('BaseButton', () => {
  it('renders a type="button" <button> by default', () => {
    const w = mountBtn()
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.text()).toBe('Simpan')
  })
  it('passes type="submit" through', () => {
    expect(mountBtn({ type: 'submit' }).attributes('type')).toBe('submit')
  })
  it('renders a link when `to` is set', () => {
    const w = mountBtn({ to: '/x' })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/x')
  })
  it('is disabled and aria-busy while loading', () => {
    const w = mountBtn({ loading: true })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('svg').exists()).toBe(true)
  })
  it('is not disabled when neither loading nor disabled', () => {
    expect(mountBtn().attributes('disabled')).toBeUndefined()
  })
  it('primary variant uses the AA-contrast background token on its face', () => {
    expect(mountBtn().find('[data-face]').classes()).toContain('bg-q-primary-strong')
  })
  it('focus ring is not on a clip-path element', () => {
    const w = mountBtn()
    expect(w.classes()).not.toContain('hud-cut')
    expect(w.classes()).not.toContain('hud-cut-sm')
    expect(w.classes()).toContain('hud-focus')
  })
  it('class="hidden lg:flex" actually hides it (no forced inline-flex)', () => {
    const w = mount(BaseButton, { attrs: { class: 'hidden lg:flex' }, slots: { default: 'x' }, global: { plugins: [router] } })
    expect(w.classes()).toContain('hidden')
    expect(w.classes()).not.toContain('inline-flex')
  })
  it('renders inline-flex when no display class is passed', () => {
    expect(mountBtn().classes()).toContain('inline-flex')
  })
  it('meets the 44px touch target', () => {
    expect(mountBtn({ size: 'sm' }).classes()).toContain('min-h-11')
  })
})
