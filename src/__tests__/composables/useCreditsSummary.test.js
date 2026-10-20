import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn(), getMyCredits: vi.fn() }))
import { getMyCredits } from '@/api/authApi'
import { useCreditsSummary, __resetCreditsSummary } from '@/composables/useCreditsSummary'

const DAY = 86_400_000
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString()

describe('useCreditsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    __resetCreditsSummary()
    useAuthStore().setAuth({ name: 'A' })
  })

  it('sums remaining_hours of non-expired credits', async () => {
    getMyCredits.mockResolvedValue({ data: { data: [
      { remaining_hours: 4, expires_at: iso(5) },
      { remaining_hours: 5, expires_at: iso(28) },
      { remaining_hours: 3, expires_at: iso(-1) },
      { remaining_hours: 0, expires_at: iso(10) },
    ] } })
    const { totalHours, refresh } = useCreditsSummary()
    await refresh()
    expect(totalHours.value).toBe(9)
  })

  it('returns 0 and does not throw on API error', async () => {
    getMyCredits.mockRejectedValue(new Error('500'))
    const { totalHours, refresh } = useCreditsSummary()
    await expect(refresh()).resolves.toBeUndefined()
    expect(totalHours.value).toBe(0)
  })

  it('shares one request between two callers', async () => {
    getMyCredits.mockResolvedValue({ data: { data: [] } })
    await Promise.all([useCreditsSummary().refresh(), useCreditsSummary().refresh()])
    expect(getMyCredits).toHaveBeenCalledTimes(1)
  })

  it('does not call the API for guests', async () => {
    useAuthStore().logout()
    const { totalHours, refresh } = useCreditsSummary()
    await refresh()
    expect(getMyCredits).not.toHaveBeenCalled()
    expect(totalHours.value).toBe(0)
  })
  it('drops an in-flight result from a previous session (logout → login as someone else)', async () => {
    let resolveA
    getMyCredits.mockImplementationOnce(() => new Promise((r) => { resolveA = r }))
    const { totalHours, refresh } = useCreditsSummary()
    const pendingA = refresh()
    useAuthStore().logout(); await refresh()
    useAuthStore().setAuth({ name: 'B' })
    getMyCredits.mockResolvedValueOnce({ data: { data: [{ remaining_hours: 3, expires_at: iso(5) }] } })
    await refresh()
    resolveA({ data: { data: [{ remaining_hours: 9, expires_at: iso(5) }] } }); await pendingA
    expect(totalHours.value).toBe(3)
  })
})

