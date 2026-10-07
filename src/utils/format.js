import { parseLocalDate } from './dates'

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
