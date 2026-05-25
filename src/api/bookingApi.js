import api from './index'
import { publicApi } from './index'

export const getAvailability        = (params)  => publicApi.get('/public/booking/availability', { params })
export const getPublicStores        = ()        => publicApi.get('/public/stores')
export const getPublicRoomTemplates = (storeId) => publicApi.get('/public/room-templates', { params: { store_id: storeId } })

export const initiateBooking  = (payload) => api.post('/customer/bookings/initiate', payload)
export const getMyBookings    = (params)  => api.get('/customer/bookings', { params })
export const getMyBookingById = (id)      => api.get(`/customer/bookings/${id}`)
