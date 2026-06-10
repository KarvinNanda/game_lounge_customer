import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/index', () => ({
  default: {
    get:  vi.fn(),
    post: vi.fn(),
  },
  publicApi: {
    get:  vi.fn(),
    post: vi.fn(),
  },
}))

import api from '@/api/index'
import { publicApi } from '@/api/index'
import {
  getAvailability,
  getPublicStores,
  getPublicRoomTemplates,
  initiateBooking,
  getMyBookings,
  getMyBookingById,
} from '@/api/bookingApi'

describe('bookingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Public endpoints (no auth required) ─────────────────────────────────────

  it('getAvailability calls publicApi GET /public/booking/availability with params', () => {
    const params = { date: '2024-06-01', store_id: 1, duration: 2 }
    getAvailability(params)
    expect(publicApi.get).toHaveBeenCalledWith('/public/booking/availability', { params })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('getAvailability works with no params', () => {
    getAvailability()
    expect(publicApi.get).toHaveBeenCalledWith('/public/booking/availability', { params: undefined })
  })

  it('getPublicStores calls publicApi GET /public/stores', () => {
    getPublicStores()
    expect(publicApi.get).toHaveBeenCalledWith('/public/stores')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('getPublicRoomTemplates calls publicApi GET /public/room-templates with store_id param', () => {
    getPublicRoomTemplates(5)
    expect(publicApi.get).toHaveBeenCalledWith('/public/room-templates', { params: { store_id: 5 } })
    expect(api.get).not.toHaveBeenCalled()
  })

  // ── Authenticated endpoints ──────────────────────────────────────────────────

  it('initiateBooking calls authenticated api POST /customer/bookings/initiate', () => {
    const payload = { store_id: 1, room_id: 2, date: '2024-06-01', start_time: '10:00', duration: 2 }
    initiateBooking(payload)
    expect(api.post).toHaveBeenCalledWith('/customer/bookings/initiate', payload)
    expect(publicApi.post).not.toHaveBeenCalled()
  })

  it('getMyBookings calls authenticated api GET /customer/bookings with params', () => {
    const params = { page: 1, status: 'confirmed' }
    getMyBookings(params)
    expect(api.get).toHaveBeenCalledWith('/customer/bookings', { params })
    expect(publicApi.get).not.toHaveBeenCalled()
  })

  it('getMyBookings works with no params', () => {
    getMyBookings()
    expect(api.get).toHaveBeenCalledWith('/customer/bookings', { params: undefined })
  })

  it('getMyBookingById calls authenticated api GET /customer/bookings/:id', () => {
    getMyBookingById(99)
    expect(api.get).toHaveBeenCalledWith('/customer/bookings/99')
    expect(publicApi.get).not.toHaveBeenCalled()
  })

  it('getMyBookingById interpolates the id correctly into the URL', () => {
    getMyBookingById('abc-uuid-123')
    expect(api.get).toHaveBeenCalledWith('/customer/bookings/abc-uuid-123')
  })

  // ── Return values ────────────────────────────────────────────────────────────

  it('initiateBooking returns the api promise', () => {
    const fakePromise = Promise.resolve({ data: { data: { hold_id: 'hold-1' } } })
    api.post.mockReturnValue(fakePromise)
    expect(initiateBooking({})).toBe(fakePromise)
  })
})
