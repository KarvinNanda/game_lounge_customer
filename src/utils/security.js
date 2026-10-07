// ── Security utilities ─────────────────────────────────────────────
// Titik terpusat untuk validasi input yang menyentuh navigasi & URL.

/**
 * Validasi path redirect agar hanya internal path yang diizinkan.
 * Mencegah open redirect: ?redirect=https://evil.com, //evil.com, /\evil.com,
 * javascript:..., serta control characters.
 *
 * @param {unknown} raw      nilai redirect mentah (query param, dsb)
 * @param {string}  fallback dikembalikan jika raw tidak aman (default '/')
 * @returns {string} path internal yang aman, atau fallback
 */
export const sanitizeRedirect = (raw, fallback = '/') => {
  if (typeof raw !== 'string' || raw.length === 0) return fallback
  // Harus path absolut internal: diawali tepat satu '/'
  if (!raw.startsWith('/')) return fallback
  // '//host' dan '/\host' diperlakukan browser sebagai protocol-relative URL
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  // Tidak boleh mengandung backslash atau skema URL
  if (raw.includes('\\')) return fallback
  if (raw.includes('://')) return fallback
  // Tolak control characters (charCode < 32) dan DEL (127)
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    if (code < 32 || code === 127) return fallback
  }
  return raw
}

/**
 * Bangun URL gambar dari path yang dikirim backend.
 * - URL http(s) absolut diteruskan apa adanya
 * - Skema lain (javascript:, data:, vbscript:, ...) DIBLOKIR → fallback
 * - Path relatif digabung dengan origin API (VITE_API_URL tanpa suffix /api)
 *
 * @param {unknown} url      path/URL gambar dari API
 * @param {string}  fallback dipakai jika url kosong/tidak aman
 * @returns {string}
 */
export const getImgUrl = (url, fallback = '/placeholder.jpg') => {
  if (typeof url !== 'string' || url.length === 0) return fallback
  if (/^https?:[/][/]/i.test(url)) return url
  // String dengan skema apapun selain http(s) ditolak
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return fallback
  const origin = (import.meta.env.VITE_API_URL || '').replace(/[/]api[/]?$/, '')
  return origin + (url.startsWith('/') ? url : `/${url}`)
}

/**
 * JSON.parse yang tidak pernah throw — untuk data dari localStorage
 * yang bisa saja korup atau dimanipulasi.
 *
 * @param {unknown} str
 * @param {*} fallback dikembalikan jika parse gagal (default null)
 */
export const safeJsonParse = (str, fallback = null) => {
  if (typeof str !== 'string') return fallback
  try {
    const parsed = JSON.parse(str)
    return parsed === undefined ? fallback : parsed
  } catch {
    return fallback
  }
}

const DEFAULT_PAYMENT_HOSTS = ['checkout.xendit.co', 'checkout-staging.xendit.co']

/**
 * Host payment gateway yang boleh jadi tujuan redirect.
 * Diambil dari VITE_PAYMENT_HOSTS (dipisah koma), default host checkout Xendit.
 */
export const getPaymentHosts = () => {
  const raw = import.meta.env.VITE_PAYMENT_HOSTS
  if (typeof raw !== 'string' || raw.trim() === '') return DEFAULT_PAYMENT_HOSTS
  return raw.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
}

/**
 * Validasi URL dari backend sebelum dipakai untuk window.location (mis. invoice_url).
 * Lolos hanya jika: path internal, same-origin, atau https ke host di allowlist
 * (tanpa userinfo, tanpa port custom). Selain itu → null.
 *
 * @param {unknown} raw
 * @param {{ allowedHosts?: string[], currentOrigin?: string }} [opts]
 * @returns {string|null}
 */
export const safeExternalRedirect = (
  raw,
  { allowedHosts = getPaymentHosts(), currentOrigin = window.location?.origin } = {},
) => {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (raw.startsWith('/')) return sanitizeRedirect(raw, '') || null

  let url
  try { url = new URL(raw) } catch { return null }

  // userinfo dipakai untuk menyamarkan host asli (https://trusted@evil.com)
  if (url.username || url.password) return null
  // Hanya skema web. javascript:/data: ber-origin "null" dan akan lolos cek
  // same-origin di halaman ber-origin "null" (file://, iframe sandbox)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (currentOrigin && url.origin === currentOrigin) return url.href
  if (url.protocol !== 'https:' || url.port !== '') return null
  return allowedHosts.includes(url.hostname.toLowerCase()) ? url.href : null
}
