import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { redirectToInvoice, isMockPaymentEnabled, mockPaymentGuard, rememberPaymentExpiry, paymentSecondsLeft, clearPaymentSession } from '@/utils/payment'

describe('redirectToInvoice', () => {
  beforeEach(() => { window.location.href = '' })

  it('returns "none" and does nothing when the backend sent no URL', () => {
    const before = vi.fn()
    expect(redirectToInvoice(undefined, before)).toBe('none')
    expect(before).not.toHaveBeenCalled()
    expect(window.location.href).toBe('')
  })

  it('returns "invalid" for a look-alike host and does not navigate or run beforeRedirect', () => {
    const before = vi.fn()
    expect(redirectToInvoice('https://checkout.xendit.co@evil.com/x', before)).toBe('invalid')
    expect(before).not.toHaveBeenCalled()
    expect(window.location.href).toBe('')
  })

  it('runs beforeRedirect then navigates for an allowed URL', () => {
    const before = vi.fn()
    expect(redirectToInvoice('https://checkout.xendit.co/web/1', before)).toBe('redirected')
    expect(before).toHaveBeenCalledOnce()
    expect(window.location.href).toBe('https://checkout.xendit.co/web/1')
  })

  it('allows an internal mock payment path', () => {
    expect(redirectToInvoice('/payment/mock?invoice_id=1')).toBe('redirected')
    expect(window.location.href).toBe('/payment/mock?invoice_id=1')
  })
})

// Guard: hanya utils/payment.js (dan interceptor 401 ke /login) yang boleh memindahkan window.location.
// Mencegah refactor berikutnya memakai invoice_url mentah dari backend.
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === '__tests__' ? [] : walk(join(dir, e.name))) : [join(dir, e.name)])
const ALLOWED = ['src/utils/payment.js', 'src/api/index.js']

describe('payment redirect guard', () => {
  it('no source file except utils/payment.js assigns window.location.href', () => {
    const offenders = walk('src')
      .filter((f) => /\.(js|vue)$/.test(f) && !ALLOWED.includes(f))
      .filter((f) => /window\.location\.href\s*=/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it.each(['src/composables/useBookingForm.js', 'src/views/EventBookingView.vue', 'src/views/CreditsView.vue'])(
    '%s uses redirectToInvoice',
    (file) => { expect(readFileSync(file, 'utf8')).toContain('redirectToInvoice(') },
  )
})

describe('mock payment flag', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('is disabled unless VITE_ENABLE_MOCK_PAYMENT is exactly "true"', () => {
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', '')
    expect(isMockPaymentEnabled()).toBe(false)
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', '1')
    expect(isMockPaymentEnabled()).toBe(false)
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', 'true')
    expect(isMockPaymentEnabled()).toBe(true)
  })

  it('mockPaymentGuard sends users home when mock payment is off', () => {
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', 'false')
    expect(mockPaymentGuard()).toEqual({ path: '/' })
  })

  it('mockPaymentGuard allows the route when mock payment is on', () => {
    vi.stubEnv('VITE_ENABLE_MOCK_PAYMENT', 'true')
    expect(mockPaymentGuard()).toBe(true)
  })
})

describe('payment expiry', () => {
  beforeEach(() => { sessionStorage.clear() })

  it('returns seconds left until expires_at', () => {
    rememberPaymentExpiry('2026-10-07T10:15:00Z')
    expect(paymentSecondsLeft(Date.parse('2026-10-07T10:00:00Z'))).toBe(15 * 60)
  })

  it('never goes below zero after expiry', () => {
    rememberPaymentExpiry('2026-10-07T10:15:00Z')
    expect(paymentSecondsLeft(Date.parse('2026-10-07T10:20:00Z'))).toBe(0)
  })

  it.each([undefined, null, '', 'not-a-date', 12345])('returns null (no countdown) for invalid expires_at %s', (raw) => {
    rememberPaymentExpiry(raw)
    expect(paymentSecondsLeft()).toBeNull()
  })

  it('an invalid value clears a previously remembered expiry', () => {
    rememberPaymentExpiry('2026-10-07T10:15:00Z')
    rememberPaymentExpiry(undefined)
    expect(paymentSecondsLeft()).toBeNull()
  })

  it('clearPaymentSession removes the expiry and intent keys', () => {
    rememberPaymentExpiry('2026-10-07T10:15:00Z')
    sessionStorage.setItem('quantum_intent_id', 'i'); sessionStorage.setItem('quantum_hold_id', 'h'); sessionStorage.setItem('quantum_event_id', 'e')
    clearPaymentSession()
    expect(paymentSecondsLeft()).toBeNull()
    expect(sessionStorage.getItem('quantum_intent_id')).toBeNull()
    expect(sessionStorage.getItem('quantum_hold_id')).toBeNull()
    expect(sessionStorage.getItem('quantum_event_id')).toBeNull()
  })
})
