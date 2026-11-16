import { describe, it, expect, afterEach } from 'vitest'
import api, { publicApi } from '@/api/index'
import { getBookingQuote, getCustomerBookingQuote } from '@/api/bookingApi'

// Tanpa mock axios: cek URL yang benar-benar dibangun, termasuk format array
const originalPublic = publicApi.defaults.adapter
const originalAuthed = api.defaults.adapter
afterEach(() => {
  publicApi.defaults.adapter = originalPublic
  api.defaults.adapter       = originalAuthed
})

const captureUrl = async (params, fn = getBookingQuote, client = publicApi) => {
  let url
  client.defaults.adapter = async (config) => {
    url = client.getUri(config)
    return { data: { data: {} }, status: 200, statusText: 'OK', headers: {}, config }
  }
  await fn(params)
  return decodeURIComponent(url)
}

describe('getBookingQuote', () => {
  it('calls GET /public/booking/quote and repeats selected_slots[] per slot', async () => {
    const url = await captureUrl({
      store_id: 1, room_template_id: 2, booking_date: '2026-10-08', selected_slots: ['10:00', '11:00'],
    })
    expect(url).toContain('/public/booking/quote?')
    expect(url).toContain('store_id=1')
    expect(url).toContain('room_template_id=2')
    expect(url).toContain('booking_date=2026-10-08')
    expect(url).toContain('selected_slots[]=10:00&selected_slots[]=11:00')
  })
})

// Login wajib: lewat client yang membawa cookie, dan voucher_id ikut dihitung server
describe('getCustomerBookingQuote', () => {
  it('calls GET /customer/bookings/quote on the logged-in client with voucher_id', async () => {
    const url = await captureUrl({
      store_id: 1, room_template_id: 2, booking_date: '2026-10-08', selected_slots: ['10:00', '11:00'], voucher_id: 'v1',
    }, getCustomerBookingQuote, api)
    expect(url).toContain('/customer/bookings/quote?')
    expect(url).toContain('selected_slots[]=10:00&selected_slots[]=11:00')
    expect(url).toContain('voucher_id=v1')
  })
})
