import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { authGuard } from '@/router/guard'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))

const makeRouter = () => {
  const r = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/login', component: { template: '<div/>' } },
      { path: '/payment/failed', component: { template: '<div/>' }, meta: { requiresAuth: true } },
    ],
  })
  r.beforeEach(authGuard)
  return r
}

describe('authGuard', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('first load of a protected URL as a guest goes to /login with redirect (no blank page)', async () => {
    const r = makeRouter()
    await r.push('/payment/failed')
    expect(r.currentRoute.value.path).toBe('/login')
    expect(r.currentRoute.value.query.redirect).toBe('/payment/failed')
  })

  it('in-app navigation to a protected page as a guest opens the login modal and stays put', async () => {
    const r = makeRouter()
    await r.push('/')
    await r.push('/payment/failed')
    expect(r.currentRoute.value.path).toBe('/')
    expect(useAuthStore().showAuthModal).toBe(true)
    expect(useAuthStore().pendingPath).toBe('/payment/failed')
  })

  it('logged-in users pass through', async () => {
    useAuthStore().setAuth({ name: 'A' })
    const r = makeRouter()
    await r.push('/payment/failed')
    expect(r.currentRoute.value.path).toBe('/payment/failed')
  })
})
