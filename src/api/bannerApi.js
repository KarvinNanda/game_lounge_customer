import { publicApi } from './index'

// Banners are public — use publicApi so token is never sent
export const getBanners    = ()   => publicApi.get('/public/banners')
export const getBannerById = (id) => publicApi.get(`/public/banners/${id}`)
