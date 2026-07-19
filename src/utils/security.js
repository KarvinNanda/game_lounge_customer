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
