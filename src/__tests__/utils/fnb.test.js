import { describe, it, expect, vi, afterEach } from 'vitest'
import { isFnbEnabled, fnbGuard } from '@/utils/fnb'

// F&B is out of scope for now (2026-11-16): hidden unless VITE_ENABLE_FNB=true.
describe('F&B feature flag', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is off when the variable is not set', () => {
    vi.stubEnv('VITE_ENABLE_FNB', '')
    expect(isFnbEnabled()).toBe(false)
  })

  it('is on only for the exact string "true"', () => {
    vi.stubEnv('VITE_ENABLE_FNB', 'true')
    expect(isFnbEnabled()).toBe(true)
    vi.stubEnv('VITE_ENABLE_FNB', '1')
    expect(isFnbEnabled()).toBe(false)
  })

  it('route guard sends the user home when F&B is off, and lets them through when on', () => {
    vi.stubEnv('VITE_ENABLE_FNB', '')
    expect(fnbGuard()).toEqual({ path: '/' })
    vi.stubEnv('VITE_ENABLE_FNB', 'true')
    expect(fnbGuard()).toBe(true)
  })

  it('both F&B routes are behind the guard', async () => {
    const { default: router } = await import('@/router')
    for (const name of ['FnbOrder', 'MyFnbOrders']) {
      const { beforeEnter } = router.getRoutes().find((r) => r.name === name)
      expect(beforeEnter).toBeTypeOf('function')
      expect(beforeEnter).toBe(fnbGuard)
    }
  })
})
