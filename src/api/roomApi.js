import api from './index'

export const getRoomRecommendations = () => api.get('/customer/room-recommendations')
export const getRoomTemplates       = () => api.get('/public/room-templates')
