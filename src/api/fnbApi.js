import api from './index'

// Public — ambil semua menu FnB (kategori + item)
export const getFnbMenu = () =>
  api.get('/public/fnb/menu')

// Customer — buat order FnB (butuh login + booking aktif)
export const createFnbOrder = (payload) =>
  api.post('/customer/fnb/orders', payload)

// Customer — riwayat order FnB saya
export const getMyFnbOrders = () =>
  api.get('/customer/fnb/orders')
