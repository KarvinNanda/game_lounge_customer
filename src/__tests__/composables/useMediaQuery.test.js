import { describe, it, expect, vi, afterEach } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

const original = window.matchMedia
afterEach(() => { window.matchMedia = original })

describe('useMediaQuery', () => {
  it('returns false without matchMedia (jsdom)', () => {
    window.matchMedia = undefined
    const scope = effectScope()
    const m = scope.run(() => useMediaQuery('(min-width: 1024px)'))
    expect(m.value).toBe(false)
    scope.stop()
  })

  it('follows the media query and removes its listener on dispose', async () => {
    let listener
    const mql = { matches: true, addEventListener: vi.fn((_, fn) => { listener = fn }), removeEventListener: vi.fn() }
    window.matchMedia = vi.fn(() => mql)
    const scope = effectScope()
    const m = scope.run(() => useMediaQuery('(min-width: 1024px)'))
    expect(m.value).toBe(true)
    listener({ matches: false }); await nextTick()
    expect(m.value).toBe(false)
    scope.stop()
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', listener)
  })
})
