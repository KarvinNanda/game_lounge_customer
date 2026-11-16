// round(amount * pct / 100), half up. 15% -> 1500 basis point.
const percentOf = (amount, pct) => {
  const bp = Math.round(pct * 100)
  return Math.floor((amount * bp + 5000) / 10000)
}

/**
 * Estimasi potongan voucher di layar Booking, dihitung dari total_price server (quote).
 * Angka final tetap dari /bookings/initiate, ini hanya untuk tampilan.
 * Rumus sama dengan backend (money.PercentOf): persen dibulatkan half up ke rupiah bulat,
 * dihitung dengan integer (basis point) supaya persen seperti 12.5 tidak kena error float.
 *
 * @param {{ discount_type: 'percentage'|'fixed', discount_value: number, max_discount?: number|null }|null} voucher
 * @param {number} base  total_price dari quote
 * @returns {number} potongan, 0..base
 */
export const estimateVoucherDiscount = (voucher, base) => {
  if (!voucher || !base) return 0
  let discount = voucher.discount_type === 'percentage'
    ? percentOf(base, voucher.discount_value)
    : voucher.discount_value
  // max_discount 0/null = tanpa batas
  if (voucher.discount_type === 'percentage' && voucher.max_discount) {
    discount = Math.min(discount, voucher.max_discount)
  }
  return Math.min(discount, base)
}

// ── Voucher yang sedang dikunci ────────────────────────────────────
// Backend mereservasi voucher selama hold booking belum dibayar (reserved_until != null).
// Voucher seperti ini ditampilkan tapi tidak bisa dipilih. Cleanup backend jalan tiap menit,
// jadi voucher bisa kembali sampai 1 menit setelah reserved_until.

export const isVoucherReserved = (v) => Boolean(v?.reserved_until)

export const usableVouchers = (list) => (list || []).filter((v) => !isVoucherReserved(v))

const CLEANUP_GRACE_MS = 60_000
const MIN_DELAY_MS     = 5_000
// Hold 15 menit + grace 1 jam: kunci tidak pernah lebih jauh dari ~75 menit. Lebih jauh dari ini
// berarti jam device salah; jangan jadwalkan (setTimeout > 2^31-1 ms malah langsung jalan berulang).
const MAX_DELAY_MS     = 90 * 60_000

/**
 * Berapa ms lagi daftar voucher perlu diambil ulang: reserved_until paling awal + 1 menit.
 * @returns {number|null} null jika tidak ada voucher yang dikunci
 */
export const voucherRefreshDelay = (list, now = Date.now()) => {
  const times = (list || []).map((v) => Date.parse(v?.reserved_until ?? '')).filter((t) => !Number.isNaN(t))
  if (!times.length) return null
  const delay = Math.max(MIN_DELAY_MS, Math.min(...times) + CLEANUP_GRACE_MS - now)
  return delay > MAX_DELAY_MS ? null : delay
}
