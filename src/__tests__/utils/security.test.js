import { describe, it, expect } from 'vitest'
import { sanitizeRedirect, getImgUrl, safeJsonParse } from '@/utils/security'

describe('sanitizeRedirect', () => {
  // ── Path internal valid ─────────────────────────────────────────────────────

  it('meloloskan path internal sederhana', () => {
    expect(sanitizeRedirect('/booking')).toBe('/booking')
  })

  it('meloloskan path dengan query string', () => {
    expect(sanitizeRedirect('/fnb-order?booking_id=12')).toBe('/fnb-order?booking_id=12')
  })

  it('meloloskan path dengan tanda hubung dan segmen dinamis', () => {
    expect(sanitizeRedirect('/my-bookings')).toBe('/my-bookings')
    expect(sanitizeRedirect('/room/5')).toBe('/room/5')
  })

  // ── Open redirect diblokir ──────────────────────────────────────────────────

  it('memblokir URL absolut https', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/')
  })

  it('memblokir URL absolut http', () => {
    expect(sanitizeRedirect('http://evil.com/phish')).toBe('/')
  })

  it('memblokir protocol-relative URL (//host)', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/')
  })

  it('memblokir backslash variant (/\\host) yang dinormalisasi browser', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBe('/')
    expect(sanitizeRedirect('/foo\\bar')).toBe('/')
  })

  it('memblokir skema javascript:', () => {
    expect(sanitizeRedirect('javascript:alert(1)')).toBe('/')
  })

  it('memblokir path yang menyelundupkan skema (://)', () => {
    expect(sanitizeRedirect('/redirect?url=https://evil.com')).toBe('/')
  })

  it('memblokir control characters', () => {
    expect(sanitizeRedirect('/book\ning')).toBe('/')
    expect(sanitizeRedirect('/book\ning')).toBe('/')
  })

  // ── Input non-string / kosong ───────────────────────────────────────────────

  it('mengembalikan fallback untuk non-string', () => {
    expect(sanitizeRedirect(null)).toBe('/')
    expect(sanitizeRedirect(undefined)).toBe('/')
    expect(sanitizeRedirect(123)).toBe('/')
    expect(sanitizeRedirect(['/a'])).toBe('/')
  })

  it('mengembalikan fallback untuk string kosong', () => {
    expect(sanitizeRedirect('')).toBe('/')
  })

  it('mengembalikan fallback untuk path relatif tanpa slash awal', () => {
    expect(sanitizeRedirect('booking')).toBe('/')
  })

  it('menghormati fallback custom', () => {
    expect(sanitizeRedirect('https://evil.com', '')).toBe('')
    expect(sanitizeRedirect(null, '/home')).toBe('/home')
  })
})

describe('getImgUrl', () => {
  // ── URL absolut http(s) diteruskan ──────────────────────────────────────────

  it('meneruskan URL https absolut apa adanya', () => {
    expect(getImgUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
  })

  it('meneruskan URL http absolut apa adanya', () => {
    expect(getImgUrl('http://cdn.example.com/a.jpg')).toBe('http://cdn.example.com/a.jpg')
  })

  // ── Skema berbahaya diblokir ────────────────────────────────────────────────

  it('memblokir skema javascript:', () => {
    expect(getImgUrl('javascript:alert(1)')).toBe('/placeholder.jpg')
  })

  it('memblokir skema data:', () => {
    expect(getImgUrl('data:text/html,<script>alert(1)</script>')).toBe('/placeholder.jpg')
  })

  it('memblokir skema vbscript:', () => {
    expect(getImgUrl('vbscript:msgbox(1)')).toBe('/placeholder.jpg')
  })

  it('memblokir string mirip http tapi bukan URL (httpevil)', () => {
    // regex ketat: harus "http://" atau "https://", bukan sekadar prefix "http"
    expect(getImgUrl('httpx://evil')).toBe('/placeholder.jpg')
  })

  // ── Path relatif digabung origin API ────────────────────────────────────────

  // Origin API mengikuti VITE_API_URL environment (vitest me-load .env)
  const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

  it('menggabungkan path relatif dengan origin API (tanpa /api)', () => {
    expect(getImgUrl('/assets/img/rooms/x.jpg')).toBe(`${API_ORIGIN}/assets/img/rooms/x.jpg`)
  })

  it('menambahkan slash jika path relatif tidak diawali slash', () => {
    expect(getImgUrl('assets/img/x.jpg')).toBe(`${API_ORIGIN}/assets/img/x.jpg`)
  })

  // ── Input kosong/invalid ────────────────────────────────────────────────────

  it('mengembalikan fallback default untuk input kosong', () => {
    expect(getImgUrl('')).toBe('/placeholder.jpg')
    expect(getImgUrl(null)).toBe('/placeholder.jpg')
    expect(getImgUrl(undefined)).toBe('/placeholder.jpg')
  })

  it('mengembalikan fallback untuk non-string', () => {
    expect(getImgUrl(42)).toBe('/placeholder.jpg')
    expect(getImgUrl({ url: '/x.jpg' })).toBe('/placeholder.jpg')
  })

  it('menghormati fallback custom', () => {
    expect(getImgUrl('', '/no-image.png')).toBe('/no-image.png')
    expect(getImgUrl('javascript:x', '/no-image.png')).toBe('/no-image.png')
  })
})

describe('safeJsonParse', () => {
  it('mem-parse JSON valid', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 })
    expect(safeJsonParse('[1,2]')).toEqual([1, 2])
    expect(safeJsonParse('"str"')).toBe('str')
    expect(safeJsonParse('null')).toBeNull()
  })

  it('mengembalikan fallback untuk JSON korup', () => {
    expect(safeJsonParse('{oops')).toBeNull()
    expect(safeJsonParse('undefined')).toBeNull()
    expect(safeJsonParse('{"a":')).toBeNull()
  })

  it('mengembalikan fallback untuk non-string', () => {
    expect(safeJsonParse(null)).toBeNull()
    expect(safeJsonParse(undefined)).toBeNull()
    expect(safeJsonParse(123)).toBeNull()
  })

  it('menghormati fallback custom', () => {
    expect(safeJsonParse('{bad', {})).toEqual({})
    expect(safeJsonParse(null, [])).toEqual([])
  })
})
