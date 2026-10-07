import { safeExternalRedirect } from './security'

export const INVALID_PAYMENT_LINK = 'Link pembayaran tidak valid. Silakan hubungi admin.'

/**
 * Redirect ke halaman pembayaran (invoice_url dari backend) — satu-satunya jalan
 * view boleh memindahkan window.location ke payment gateway.
 *
 * @param {unknown}  rawUrl          invoice_url mentah dari API
 * @param {Function} [beforeRedirect] dipanggil hanya jika URL valid (mis. simpan hold_id)
 * @returns {'redirected'|'invalid'|'none'}
 *   none    → backend tidak mengirim URL
 *   invalid → URL ditolak allowlist; caller tampilkan error, tidak ada redirect
 */
export const redirectToInvoice = (rawUrl, beforeRedirect) => {
  if (!rawUrl) return 'none'
  const target = safeExternalRedirect(rawUrl)
  if (!target) return 'invalid'
  beforeRedirect?.()
  window.location.href = target
  return 'redirected'
}

/**
 * Mock payment (halaman /payment/mock + endpoint mock-confirm) hanya ada di dev/staging.
 * Di production endpoint mock-confirm tidak ada, jadi default-nya mati.
 */
export const isMockPaymentEnabled = () => import.meta.env.VITE_ENABLE_MOCK_PAYMENT === 'true'

// Route guard untuk /payment/mock
export const mockPaymentGuard = () => (isMockPaymentEnabled() ? true : { path: '/' })

// ── Batas waktu pembayaran ─────────────────────────────────────────
// Invoice kedaluwarsa bersama hold (booking 15 menit, credits 30 menit).
// expires_at dari response initiate disimpan, lalu dibaca halaman pembayaran.
const EXPIRY_KEY = 'quantum_payment_expires_at'

export const rememberPaymentExpiry = (expiresAt) => {
  const valid = typeof expiresAt === 'string' && !Number.isNaN(Date.parse(expiresAt))
  if (valid) sessionStorage.setItem(EXPIRY_KEY, expiresAt)
  else sessionStorage.removeItem(EXPIRY_KEY)
}

// Bersihkan semua jejak transaksi setelah selesai/batal
const SESSION_KEYS = ['quantum_intent_id', 'quantum_hold_id', 'quantum_event_id', EXPIRY_KEY]
export const clearPaymentSession = () => SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k))

/**
 * @param {number} [now] epoch ms (untuk test)
 * @returns {number|null} sisa detik (min 0), atau null jika expires_at tidak diketahui
 */
export const paymentSecondsLeft = (now = Date.now()) => {
  const expiresAt = Date.parse(sessionStorage.getItem(EXPIRY_KEY) ?? '')
  if (Number.isNaN(expiresAt)) return null
  return Math.max(0, Math.floor((expiresAt - now) / 1000))
}
