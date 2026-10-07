import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RevealOnScroll from '@/components/ui/RevealOnScroll.vue'

afterEach(() => { vi.unstubAllGlobals() })

describe('RevealOnScroll', () => {
  it('shows content immediately when IntersectionObserver is missing', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const w = mount(RevealOnScroll, { slots: { default: 'Hi' } })
    await nextTick()
    expect(w.classes()).toContain('is-visible')
  })

  it('reveals once on intersection and then disconnects', async () => {
    let callback
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', vi.fn(function (cb) {
      callback = cb
      this.observe = vi.fn()
      this.disconnect = disconnect
    }))
    const w = mount(RevealOnScroll, { slots: { default: 'Hi' } })
    expect(w.classes()).not.toContain('is-visible')
    callback([{ isIntersecting: true }])
    await nextTick()
    expect(w.classes()).toContain('is-visible')
    expect(disconnect).toHaveBeenCalled()
  })

  it('sets the stagger delay as a CSS variable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const w = mount(RevealOnScroll, { props: { delay: 120 } })
    expect(w.attributes('style')).toContain('--reveal-delay: 120ms')
  })
})
