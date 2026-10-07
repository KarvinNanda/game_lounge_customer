import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scrollBehavior, notifyPageLeft } from '@/router/scroll'

const route = (path) => ({ path })

describe('router scrollBehavior', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('waits for the old page to finish leaving before scrolling to top', async () => {
    let result
    scrollBehavior(route('/b'), route('/a'), null).then((r) => { result = r })
    await Promise.resolve()
    expect(result).toBeUndefined()          // belum scroll selama halaman lama fade-out
    notifyPageLeft()
    await vi.runAllTimersAsync()
    expect(result).toEqual({ top: 0 })
  })

  it('restores the saved position on browser back/forward', async () => {
    const p = scrollBehavior(route('/b'), route('/a'), { left: 0, top: 640 })
    notifyPageLeft()
    await expect(p).resolves.toEqual({ left: 0, top: 640 })
  })

  it('does not hang if the leave transition never reports (fallback timeout)', async () => {
    const p = scrollBehavior(route('/b'), route('/a'), null)
    await vi.advanceTimersByTimeAsync(400)
    await expect(p).resolves.toEqual({ top: 0 })
  })

  it('does not wait when only the query/hash changes on the same page', async () => {
    await expect(scrollBehavior(route('/a'), route('/a'), null)).resolves.toBe(false)
  })

  it('a superseded navigation does not scroll (overlapping back presses)', async () => {
    const first  = scrollBehavior(route('/b'), route('/a'), { top: 100 })
    const second = scrollBehavior(route('/c'), route('/b'), { top: 640 })
    notifyPageLeft()
    await vi.advanceTimersByTimeAsync(400)
    await expect(second).resolves.toEqual({ top: 640 })
    await expect(first).resolves.toBe(false)
  })
})
