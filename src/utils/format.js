import { parseLocalDate, localISODate } from './dates'

// ── Format tampilan (id-ID) ────────────────────────────────────────

export const formatRp = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : `Rp ${Math.round(n).toLocaleString('id-ID')}`

// 'YYYY-MM-DD' dibaca sebagai tanggal lokal; timestamp lengkap (expires_at) apa adanya
const toDate = (d) => (d ? parseLocalDate(d) ?? new Date(d) : null)

export const formatDateLong = (d) =>
  toDate(d)?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? ''

export const formatDateShort = (d) =>
  toDate(d)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) ?? ''

export const formatCapacity = (min, max) => (!min || min === max ? `${max} orang` : `${min}–${max} orang`)

// Endpoint list mengirim fasilitas sebagai string, endpoint detail sebagai object {name}
export const facilityName = (f) => (typeof f === 'string' ? f : f?.name ?? '')

// Harga singkat untuk kartu: 15RB, 250RB, 1.5JT
export const formatRpShort = (price) => {
  if (!price) return '—'
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}JT`
  if (price >= 1_000)     return `${Math.round(price / 1_000)}RB`
  return `Rp ${price}`
}

// 'Hari ini' / 'Besok' / 'Sab, 24 Okt' untuk tanggal booking (YYYY-MM-DD lokal)
export const formatDayLabel = (iso, now = new Date()) => {
  const day = iso ? parseLocalDate(String(iso).slice(0, 10)) : null
  if (!day) return ''
  const today    = localISODate(now)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (localISODate(day) === today) return 'Hari ini'
  if (localISODate(day) === localISODate(tomorrow)) return 'Besok'
  const weekday = day.toLocaleDateString('id-ID', { weekday: 'short' }).replace('.', '')
  const date    = day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).replace('.', '')
  return `${weekday}, ${date}`
}
