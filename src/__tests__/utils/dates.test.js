import { describe, it, expect, afterEach, vi } from 'vitest'
import { localISODate, parseLocalDate, addHour } from '@/utils/dates'

afterEach(() => { vi.useRealTimers() })

describe('localISODate', () => {
  it('uses the local calendar date, not UTC (01:30 WIB is still "today" locally)', () => {
    // Simulasikan jam lokal 01:30 pada 8 Okt; di UTC ini masih 7 Okt
    const d = new Date(2026, 9, 8, 1, 30)
    expect(localISODate(d)).toBe('2026-10-08')
  })

  it('pads month and day', () => {
    expect(localISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('defaults to now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 8, 23, 59))
    expect(localISODate()).toBe('2026-10-08')
  })
})

describe('parseLocalDate', () => {
  it('returns local midnight of that day (not UTC midnight)', () => {
    const d = parseLocalDate('2026-10-08')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 8, 0])
  })

  it('returns null for empty or malformed input', () => {
    expect(parseLocalDate('')).toBeNull()
    expect(parseLocalDate('08-10-2026')).toBeNull()
    expect(parseLocalDate(undefined)).toBeNull()
  })
})

describe('addHour', () => {
  it('adds one hour', () => { expect(addHour('14:00')).toBe('15:00') })
  it('wraps past midnight', () => { expect(addHour('23:00')).toBe('00:00') })
})
