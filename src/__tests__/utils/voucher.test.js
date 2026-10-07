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

  it('never discounts more than the price', () => {
    expect(estimateVoucherDiscount(fixed(100000), 68000)).toBe(68000)
    expect(estimateVoucherDiscount(pct(150), 68000)).toBe(68000)
  })
})
