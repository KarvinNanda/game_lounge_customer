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
