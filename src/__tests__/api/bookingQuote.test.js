import { describe, it, expect, afterEach } from 'vitest'
import { publicApi } from '@/api/index'
import { getBookingQuote } from '@/api/bookingApi'

// Tanpa mock axios: cek URL yang benar-benar dibangun, termasuk format array
const originalAdapter = publicApi.defaults.adapter
afterEach(() => { publicApi.defaults.adapter = originalAdapter })

const captureUrl = async (params) => {
  let url
  publicApi.defaults.adapter = async (config) => {
    url = publicApi.getUri(config)
    return { data: { data: {} }, status: 200, statusText: 'OK', headers: {}, config }
  }
  await getBookingQuote(params)
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
