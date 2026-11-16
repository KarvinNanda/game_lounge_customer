import { describe, it, expect } from 'vitest'
import { isVoucherReserved, usableVouchers, voucherRefreshDelay } from '@/utils/voucher'
import { formatTimeWIB } from '@/utils/dates'

// A voucher is reserved while an unpaid booking hold holds it. Backend: reserved_until != null
// means "do not let the user pick it"; it can come back up to 1 minute after reserved_until.
const free   = { voucher_id: 'a', reserved_until: null }
const locked = { voucher_id: 'b', reserved_until: '2026-11-16T20:32:10.325+07:00', hold_id: 'h1' }
const later  = { voucher_id: 'c', reserved_until: '2026-11-16T21:05:00+07:00', hold_id: 'h2' }

describe('reserved vouchers', () => {
  it('is reserved only when reserved_until is set', () => {
    expect(isVoucherReserved(free)).toBe(false)
    expect(isVoucherReserved({ voucher_id: 'x' })).toBe(false) // old response shape
    expect(isVoucherReserved(locked)).toBe(true)
  })

  it('usableVouchers drops the reserved ones', () => {
    expect(usableVouchers([free, locked, later])).toEqual([free])
    expect(usableVouchers(null)).toEqual([])
  })

  it('formats the lock time as HH:mm in WIB, whatever the device time zone', () => {
    expect(formatTimeWIB(locked.reserved_until)).toBe('20:32')
    expect(formatTimeWIB('2026-11-16T13:32:00Z')).toBe('20:32')
    expect(formatTimeWIB('not a date')).toBe('')
  })

  it('refresh delay = earliest reserved_until + 1 minute, from now', () => {
    const now = Date.parse('2026-11-16T20:30:10.325+07:00')
    expect(voucherRefreshDelay([free, later, locked], now)).toBe(2 * 60_000 + 60_000)
  })

  it('refreshes soon (not in the past) when reserved_until already passed, and never without reserved vouchers', () => {
    const now = Date.parse('2026-11-16T20:40:00+07:00')
    expect(voucherRefreshDelay([locked], now)).toBe(5_000)
    expect(voucherRefreshDelay([free], now)).toBeNull()
    expect(voucherRefreshDelay([], now)).toBeNull()
  })

  // setTimeout fires at once for delays above 2^31-1 ms (~24.8 days): with a wrong device clock that
  // would refetch in a tight loop. Far-away locks are not scheduled at all.
  it('does not schedule a refresh further away than one hour and a half', () => {
    const now = Date.parse('2026-10-08T12:00:00+07:00')
    expect(voucherRefreshDelay([locked], now)).toBeNull()
  })
})
