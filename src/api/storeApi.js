import api from './index'

export const getStores    = (params) => api.get('/public/stores', { params })
export const getStoreById = (id)     => api.get(`/public/stores/${id}`)
