import { describe, it, expect } from 'vitest'
import { formatRp, formatDateLong, formatDateShort, formatCapacity } from '@/utils/format'

describe('format', () => {
  it('formatRp uses id-ID grouping and a dash for empty', () => {
    expect(formatRp(68000)).toBe('Rp 68.000')
    expect(formatRp(0)).toBe('Rp 0')
    expect(formatRp(null)).toBe('—')
  })
  it('formatDateLong reads a YYYY-MM-DD as a local date', () => {
    expect(formatDateLong('2026-10-08')).toBe('Kamis, 8 Oktober 2026')
  })
  it('formatDateShort', () => {
    expect(formatDateShort('2026-10-08')).toBe('8 Okt 2026')
    expect(formatDateShort('')).toBe('')
  })
  it('formatCapacity', () => {
    expect(formatCapacity(4, 4)).toBe('4 orang')
    expect(formatCapacity(2, 6)).toBe('2–6 orang')
  })
})
