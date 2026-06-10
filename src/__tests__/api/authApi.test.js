import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/index', () => ({
  default: {
    get:  vi.fn(),
    post: vi.fn(),
    put:  vi.fn(),
  },
  publicApi: {
    get:  vi.fn(),
    post: vi.fn(),
  },
}))

import api from '@/api/index'
import {
  customerLogin,
  getCustomerMe,
  customerLogout,
  updateCustomerProfile,
  changeCustomerPassword,
  getCreditsExpiring,
} from '@/api/authApi'

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('customerLogin calls POST /customer/login with the provided payload', () => {
    const payload = { email: 'user@test.com', password: 'secret' }
    customerLogin(payload)
    expect(api.post).toHaveBeenCalledWith('/customer/login', payload)
    expect(api.post).toHaveBeenCalledOnce()
  })

  it('getCustomerMe calls GET /customer/me with no arguments', () => {
    getCustomerMe()
    expect(api.get).toHaveBeenCalledWith('/customer/me')
    expect(api.get).toHaveBeenCalledOnce()
  })

  it('customerLogout calls POST /customer/logout with no body', () => {
    customerLogout()
    expect(api.post).toHaveBeenCalledWith('/customer/logout')
    expect(api.post).toHaveBeenCalledOnce()
  })

  it('updateCustomerProfile calls PUT /customer/profile with the provided payload', () => {
    const payload = { name: 'New Name', whatsapp: '08123456789' }
    updateCustomerProfile(payload)
    expect(api.put).toHaveBeenCalledWith('/customer/profile', payload)
    expect(api.put).toHaveBeenCalledOnce()
  })

  it('changeCustomerPassword calls PUT /customer/change-password with the provided payload', () => {
    const payload = { old_password: 'old', new_password: 'new', new_password_confirmation: 'new' }
    changeCustomerPassword(payload)
    expect(api.put).toHaveBeenCalledWith('/customer/change-password', payload)
    expect(api.put).toHaveBeenCalledOnce()
  })

  it('getCreditsExpiring calls GET /customer/credits/expiring', () => {
    getCreditsExpiring()
    expect(api.get).toHaveBeenCalledWith('/customer/credits/expiring')
    expect(api.get).toHaveBeenCalledOnce()
  })

  it('each function returns the axios promise', () => {
    const fakePromise = Promise.resolve({ data: {} })
    api.get.mockReturnValue(fakePromise)

    const result = getCustomerMe()
    expect(result).toBe(fakePromise)
  })
})
