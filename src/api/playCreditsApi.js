import api from './index'

// Public — tanpa login
export const getPlayCreditsPackages = (storeId) =>
  api.get('/public/play-credits/packages', { params: { store_id: storeId } })

// Customer — butuh login
export const initiatePlayCreditsPurchase = (payload) =>
  api.post('/customer/play-credits/purchase/initiate', payload)

export const mockConfirmPlayCredits = (intentId) =>
  api.post(`/customer/play-credits/purchase/${intentId}/mock-confirm`)

export const getMyCredits = () =>
  api.get('/customer/credits/expiring') // endpoint yang sudah ada
