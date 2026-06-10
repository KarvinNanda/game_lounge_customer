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
import { getBanners, getBannerById } from '@/api/bannerApi'

describe('bannerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getBanners ───────────────────────────────────────────────────────────────

  it('getBanners calls GET /public/banners via publicApi', () => {
    getBanners()
    expect(publicApi.get).toHaveBeenCalledWith('/public/banners')
    expect(publicApi.get).toHaveBeenCalledOnce()
  })

  it('getBanners does NOT use the authenticated api', () => {
    getBanners()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('getBanners returns the publicApi promise', () => {
    const fakePromise = Promise.resolve({ data: { data: [] } })
    publicApi.get.mockReturnValue(fakePromise)
    expect(getBanners()).toBe(fakePromise)
  })

  // ── getBannerById ────────────────────────────────────────────────────────────

  it('getBannerById calls GET /public/banners/:id with the correct id', () => {
    getBannerById(42)
    expect(publicApi.get).toHaveBeenCalledWith('/public/banners/42')
    expect(publicApi.get).toHaveBeenCalledOnce()
  })

  it('getBannerById works with string ids', () => {
    getBannerById('promo-banner')
    expect(publicApi.get).toHaveBeenCalledWith('/public/banners/promo-banner')
  })

  it('getBannerById does NOT use the authenticated api', () => {
    getBannerById(1)
    expect(api.get).not.toHaveBeenCalled()
  })
})
