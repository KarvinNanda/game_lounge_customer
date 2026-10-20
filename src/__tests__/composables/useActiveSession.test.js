import { describe, it, expect, vi, beforeEach } from 'vitest'
import { effectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn(), getMyBookings: vi.fn() }))
import { getMyBookings } from '@/api/authApi'
import { useActiveSession } from '@/composables/useActiveSession'

const page = (rows) => ({ data: { data: rows, meta: { page: 1, total_page: 1 } } })
const b = (id, date, start = '19:00:00', status = 'upcoming') => ({ id, booking_date: date, start_time: start, status })

const run = async () => {
  const scope = effectScope()
  const result = scope.run(() => useActiveSession())
  await flushPromises()
  return result
}

describe('useActiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    useAuthStore().setAuth({ name: 'A' })
  })

  it('prefers an ongoing booking', async () => {
    getMyBookings.mockImplementation(({ status }) =>
      Promise.resolve(page(status === 'ongoing' ? [b(7, '2026-10-20', '14:00:00', 'ongoing')] : [b(8, '2026-10-21')])))
    const { session, kind } = await run()
    expect(kind.value).toBe('ongoing')
    expect(session.value.id).toBe(7)
    expect(getMyBookings).toHaveBeenCalledWith({ status: 'ongoing', page: 1, per_page: 1 })
  })

  it('falls back to the earliest upcoming booking (API sorts newest first)', async () => {
    getMyBookings.mockImplementation(({ status }) =>
      Promise.resolve(page(status === 'ongoing' ? [] : [b(1, '2026-10-25'), b(2, '2026-10-22', '20:00:00'), b(3, '2026-10-22', '15:00:00'), b(4, '2026-10-30')])))
    const { session, kind } = await run()
    expect(kind.value).toBe('upcoming')
    expect(session.value.id).toBe(3)
  })

  it('returns null for guests without calling the API', async () => {
    useAuthStore().logout()
    const { session, kind } = await run()
    expect(session.value).toBeNull()
    expect(kind.value).toBeNull()
    expect(getMyBookings).not.toHaveBeenCalled()
  })

  it('returns null on API error', async () => {
    getMyBookings.mockRejectedValue(new Error('500'))
    const { session, loading } = await run()
    expect(session.value).toBeNull()
    expect(loading.value).toBe(false)
  })
})
