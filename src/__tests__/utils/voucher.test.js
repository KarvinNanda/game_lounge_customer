import { describe, it, expect } from 'vitest'
import { estimateVoucherDiscount } from '@/utils/voucher'

const pct   = (value, max) => ({ discount_type: 'percentage', discount_value: value, max_discount: max })
const fixed = (value)      => ({ discount_type: 'fixed',      discount_value: value })

describe('estimateVoucherDiscount', () => {
  it('returns 0 without a voucher or without a price', () => {
    expect(estimateVoucherDiscount(null, 100000)).toBe(0)
    expect(estimateVoucherDiscount(pct(10), 0)).toBe(0)
    expect(estimateVoucherDiscount(pct(10), undefined)).toBe(0)
  })

  it('applies a percentage of the server total', () => {
    expect(estimateVoucherDiscount(pct(10), 68000)).toBe(6800)
  })

  it('caps a percentage discount at max_discount', () => {
    expect(estimateVoucherDiscount(pct(50, 20000), 100000)).toBe(20000)
  })

  it('does not cap when the discount is below max_discount', () => {
    expect(estimateVoucherDiscount(pct(10, 20000), 100000)).toBe(10000)
  })

  it('treats max_discount 0/null as "no cap"', () => {
    expect(estimateVoucherDiscount(pct(50, 0), 100000)).toBe(50000)
    expect(estimateVoucherDiscount(pct(50, null), 100000)).toBe(50000)
  })

  it('applies a fixed discount', () => {
    expect(estimateVoucherDiscount(fixed(15000), 68000)).toBe(15000)
  })

  // Same cases as backend money.PercentOf (money/rupiah_test.go): half up to whole rupiah.
  it('rounds a percentage discount half up to whole rupiah, exactly like the backend', () => {
    const cases = [
      [10, 15, 2], [30, 25, 8], [3333, 15, 500], [10001, 15, 1500],
      [33333, 15, 5000], [66667, 15, 10000], [1, 50, 1], [1, 49, 0],
      [100000, 12.5, 12500],
    ]
    for (const [amount, value, want] of cases) {
      expect(estimateVoucherDiscount(pct(value), amount), `${value}% of ${amount}`).toBe(want)
    }
  })

  it('always returns whole rupiah, so total = price - discount matches /bookings/initiate', () => {
    const d = estimateVoucherDiscount(pct(15), 33333)
    expect(Number.isInteger(d)).toBe(true)
    expect(33333 - d).toBe(28333)
  })

  it('never discounts more than the price', () => {
    expect(estimateVoucherDiscount(fixed(100000), 68000)).toBe(68000)
    expect(estimateVoucherDiscount(pct(150), 68000)).toBe(68000)
  })
})
