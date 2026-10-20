import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

const originals = { mm: window.matchMedia, raf: window.requestAnimationFrame }
afterEach(() => { window.matchMedia = originals.mm; window.requestAnimationFrame = originals.raf; vi.restoreAllMocks() })

describe('useCountUp', () => {
  it('ends exactly on a fractional value (2.5 stays 2.5, not 3)', async () => {
    window.matchMedia = vi.fn(() => ({ matches: false }))
    const frames = []
    window.requestAnimationFrame = (cb) => { frames.push(cb); return frames.length }
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const source = ref(0)
    const scope = effectScope()
    const display = scope.run(() => useCountUp(source, 400))
    source.value = 2.5; await nextTick()
    while (frames.length) frames.shift()(1000)
    expect(display.value).toBe(2.5)
    scope.stop()
  })

  it('shows the value at once without matchMedia/rAF (reduced motion or tests)', async () => {
    window.matchMedia = undefined
    const source = ref(0)
    const scope = effectScope()
    const display = scope.run(() => useCountUp(source))
    source.value = 9; await nextTick()
    expect(display.value).toBe(9)
    scope.stop()
  })
})
