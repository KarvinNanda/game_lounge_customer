import api from './index'

export const customerLogin         = (payload) => api.post('/customer/login', payload)
export const getCustomerMe         = ()        => api.get('/customer/me')
export const customerLogout        = ()        => api.post('/customer/logout')
export const updateCustomerProfile = (payload) => api.put('/customer/profile', payload)
export const changeCustomerPassword= (payload) => api.put('/customer/change-password', payload)
export const getCreditsExpiring    = ()        => api.get('/customer/credits/expiring')
