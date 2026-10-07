// ── Tanggal & jam lokal ────────────────────────────────────────────
// Jangan pakai toISOString() untuk "hari ini": hasilnya tanggal UTC,
// jadi antara 00:00–07:00 WIB masih menunjuk ke kemarin.

const pad = (n) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' menurut kalender lokal device */
export const localISODate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/**
 * 'YYYY-MM-DD' → Date di tengah malam lokal. new Date('2026-10-08') justru UTC midnight.
 * @returns {Date|null}
 */
export const parseLocalDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** 'HH:MM' + 1 jam, melewati tengah malam kembali ke 00:00 */
export const addHour = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${pad((h + 1) % 24)}:${pad(m)}`
}

const SOON_DAYS = 7
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/**
 * Status masa berlaku (credits, voucher). Selisih dihitung per hari kalender lokal.
 * @returns {{ state: 'none'|'expired'|'soon'|'ok', days: number|null, label: string }}
 */
export const expiryState = (expiresAt, now = new Date()) => {
  if (!expiresAt) return { state: 'none', days: null, label: 'Tanpa batas' }
  const end = expiresAt instanceof Date ? expiresAt : parseLocalDate(expiresAt) ?? new Date(expiresAt)
  if (Number.isNaN(end.getTime())) return { state: 'none', days: null, label: 'Tanpa batas' }
  if (end < now) return { state: 'expired', days: 0, label: 'Kedaluwarsa' }
  const days = Math.round((startOfDay(end) - startOfDay(now)) / 86_400_000)
  if (days > SOON_DAYS) return { state: 'ok', days, label: `${days} hari lagi` }
  return { state: 'soon', days, label: days === 0 ? 'Hari ini' : `${days} hari lagi` }
}

/**
 * Untuk kolom DATE (mis. voucher end_date): berlaku sampai akhir hari itu (inklusif),
 * sama seperti backend (end_date >= hari ini). Hanya bagian YYYY-MM-DD yang dipakai,
 * karena backend bisa mengirim DATE sebagai "YYYY-MM-DDT00:00:00+07:00".
 */
export const dateOnlyExpiryState = (endDate, now = new Date()) => {
  if (!endDate) return expiryState(null, now)
  const day = parseLocalDate(String(endDate).slice(0, 10))
  if (!day) return expiryState(null, now)
  const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999)
  return expiryState(endOfDay, now)
}
