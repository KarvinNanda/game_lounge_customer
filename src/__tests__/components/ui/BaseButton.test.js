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
  it('primary variant uses the AA-contrast background token', () => {
    expect(mountBtn().classes()).toContain('bg-q-primary-strong')
  })
  it('meets the 44px touch target', () => {
    expect(mountBtn({ size: 'sm' }).classes()).toContain('min-h-11')
  })
})
