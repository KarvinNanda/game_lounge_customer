import api from './index'
import { publicApi } from './index'

export const getPublicStores          = ()        => publicApi.get('/public/stores')
export const getPublicRoomTemplates   = (storeId) => publicApi.get('/public/room-templates', { params: { store_id: storeId } })
export const getRoomTemplateById      = (id)      => publicApi.get(`/public/room-templates/${id}`)

// Hourly slot grid — replaces old getAvailability
export const getBookingSlots          = (params)  => publicApi.get('/public/booking/slots', { params })
// Keep legacy for backward compat if needed
export const getAvailability          = (params)  => publicApi.get('/public/booking/availability', { params })

export const initiateBooking          = (payload) => api.post('/customer/bookings/initiate', payload)
export const getMyBookings            = (params)  => api.get('/customer/bookings', { params })
export const getMyBookingById         = (id)      => api.get(`/customer/bookings/${id}`)

export const getMyVouchersForBooking  = (params)  => api.get('/customer/vouchers/available', { params })
export const checkEventAvailability   = (params)  => api.get('/public/event-booking/availability', { params })
export const initiateEventBooking     = (payload) => api.post('/customer/event-bookings/initiate', payload)
export const mockConfirmEvent         = (eventId) => api.post(`/customer/event-bookings/${eventId}/mock-confirm`)
