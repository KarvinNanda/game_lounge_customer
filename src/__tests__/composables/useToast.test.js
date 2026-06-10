import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * useToast uses a module-level singleton (toasts ref + uid counter).
 * We reset the module before each test via vi.resetModules() + dynamic import
 * so every test starts with a fresh, empty toasts array.
 */
describe('useToast', () => {
  let useToast

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    const mod = await import('@/composables/useToast')
    useToast = mod.useToast
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Initial state ────────────────────────────────────────────────────────────

  it('starts with no toasts', () => {
    const { toasts } = useToast()
    expect(toasts.value).toHaveLength(0)
  })

  // ── Adding toasts ────────────────────────────────────────────────────────────

  it('success() adds a toast with type "success"', () => {
    const { toasts, success } = useToast()
    success('Saved successfully')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ message: 'Saved successfully', type: 'success' })
  })

  it('error() adds a toast with type "error"', () => {
    const { toasts, error } = useToast()
    error('Something went wrong')
    expect(toasts.value[0]).toMatchObject({ message: 'Something went wrong', type: 'error' })
  })

  it('info() adds a toast with type "info"', () => {
    const { toasts, info } = useToast()
    info('Just so you know')
    expect(toasts.value[0]).toMatchObject({ message: 'Just so you know', type: 'info' })
  })

  it('warning() adds a toast with type "warning"', () => {
    const { toasts, warning } = useToast()
    warning('Proceed with caution')
    expect(toasts.value[0]).toMatchObject({ message: 'Proceed with caution', type: 'warning' })
  })

  it('each toast receives a unique numeric id', () => {
    const { toasts, success } = useToast()
    success('First')
    success('Second')
    const [a, b] = toasts.value
    expect(typeof a.id).toBe('number')
    expect(typeof b.id).toBe('number')
    expect(a.id).not.toBe(b.id)
  })

  it('multiple toasts coexist before auto-removal', () => {
    const { toasts, success, error, info } = useToast()
    success('A')
    error('B')
    info('C')
    expect(toasts.value).toHaveLength(3)
  })

  // ── Manual removal ───────────────────────────────────────────────────────────

  it('remove() deletes the toast matching the given id', () => {
    const { toasts, success, remove } = useToast()
    const id = success('Delete me')
    expect(toasts.value).toHaveLength(1)
    remove(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('remove() only deletes the targeted toast', () => {
    const { toasts, success, remove } = useToast()
    success('Keep me')
    const id = success('Delete me')
    remove(id)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Keep me')
  })

  it('remove() with a non-existent id does not throw', () => {
    const { remove } = useToast()
    expect(() => remove(9999)).not.toThrow()
  })

  // ── Auto-removal (setTimeout) ────────────────────────────────────────────────

  it('auto-removes toast after the default 3500 ms', () => {
    const { toasts, info } = useToast()
    info('Gone soon')
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(3500)
    expect(toasts.value).toHaveLength(0)
  })

  it('toast still exists just before the default duration expires', () => {
    const { toasts, info } = useToast()
    info('Still here')
    vi.advanceTimersByTime(3499)
    expect(toasts.value).toHaveLength(1)
  })

  it('auto-removes toast after a custom duration', () => {
    const { toasts, success } = useToast()
    success('Fast toast', 1000)
    vi.advanceTimersByTime(999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('toasts with different durations expire independently', () => {
    const { toasts, info } = useToast()
    info('Short', 1000)
    info('Long', 5000)
    vi.advanceTimersByTime(1000)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Long')
  })

  // ── Return value of add helpers ──────────────────────────────────────────────

  it('success() returns the new toast id', () => {
    const { success } = useToast()
    const id = success('Hello')
    expect(typeof id).toBe('number')
  })
})
