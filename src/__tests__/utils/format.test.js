import { describe, it, expect } from 'vitest'
import { formatRp, formatDateLong, formatDateShort, formatCapacity, formatRpShort, formatDayLabel } from '@/utils/format'

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

describe('formatRpShort', () => {
  it.each([[15000, '15RB'], [250000, '250RB'], [1000000, '1JT'], [1500000, '1.5JT'], [500, 'Rp 500'], [0, '—'], [null, '—']])(
    '%s → %s', (n, out) => expect(formatRpShort(n)).toBe(out))
})

describe('formatDayLabel', () => {
  const now = new Date(2026, 9, 20, 10, 0) // Sel, 20 Okt 2026 (lokal)
  it('says Hari ini / Besok for the next two days', () => {
    expect(formatDayLabel('2026-10-20', now)).toBe('Hari ini')
    expect(formatDayLabel('2026-10-21', now)).toBe('Besok')
  })
  it('uses a short weekday + date otherwise', () => {
    expect(formatDayLabel('2026-10-24', now)).toBe('Sab, 24 Okt')
  })
  it('returns an empty string for missing dates', () => {
    expect(formatDayLabel('', now)).toBe('')
  })
})
