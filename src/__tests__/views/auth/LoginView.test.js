import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'

// Mock API and composables
vi.mock('@/api/authApi', () => ({
  customerLogin: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error:   vi.fn(),
    info:    vi.fn(),
    warning: vi.fn(),
  })),
}))

import { customerLogin } from '@/api/authApi'
import { useToast } from '@/composables/useToast'

const makeRouter = async (query = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login',   name: 'Login',   component: { template: '<div/>' } },
      { path: '/',        name: 'Home',    component: { template: '<div/>' } },
      { path: '/booking', name: 'Booking', component: { template: '<div/>' } },
    ],
  })
  const path = query.redirect
    ? `/login?redirect=${encodeURIComponent(query.redirect)}`
    : '/login'
  await router.push(path)
  await router.isReady()
  return router
}

const mountLogin = async (routeQuery = {}) => {
  setActivePinia(createPinia())
  const router = await makeRouter(routeQuery)
  const wrapper = mount(LoginView, {
    global: {
      plugins: [router],
      stubs: { Teleport: true },
    },
    attachTo: document.body,
  })
  return { wrapper, router }
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  it('renders the email input', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('renders the password input', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('renders the login submit button', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.find('button[type="submit"]').text()).toContain('Login Sekarang')
  })

  it('renders the Lupa Password link', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.text()).toContain('Lupa Password?')
  })

  it('does NOT render the back button when there is no redirect query', async () => {
    const { wrapper } = await mountLogin()
    const buttons = wrapper.findAll('button')
    const backBtn = buttons.find(b => b.text().includes('Kembali'))
    expect(backBtn).toBeUndefined()
  })

  it('renders the back button when a redirect query param exists', async () => {
    const { wrapper } = await mountLogin({ redirect: '/booking' })
    expect(wrapper.text()).toContain('Kembali')
  })

  // ── Form interaction ─────────────────────────────────────────────────────────

  it('updates email model when user types', async () => {
    const { wrapper } = await mountLogin()
    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('test@example.com')
    expect(emailInput.element.value).toBe('test@example.com')
  })

  it('toggles password visibility when eye button is clicked', async () => {
    const { wrapper } = await mountLogin()
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)

    // Click the toggle button (the 👁️ button inside the password field wrapper)
    const toggleBtn = wrapper.find('button[type="button"]')
    await toggleBtn.trigger('click')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)

    await toggleBtn.trigger('click')
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('disables the submit button while loading', async () => {
    customerLogin.mockReturnValue(new Promise(() => {})) // never resolves

    const { wrapper } = await mountLogin()
    await wrapper.find('input[type="email"]').setValue('a@b.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
    expect(submitBtn.text()).toContain('Memproses')
  })

  // ── Successful login ─────────────────────────────────────────────────────────

  it('calls customerLogin with the form credentials', async () => {
    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Alice' } } },
    })

    const { wrapper } = await mountLogin()
    await wrapper.find('input[type="email"]').setValue('alice@test.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(customerLogin).toHaveBeenCalledWith({
      email:    'alice@test.com',
      password: 'password123',
    })
  })

  it('shows a welcome success toast on successful login', async () => {
    const mockToast = { success: vi.fn(), error: vi.fn() }
    useToast.mockReturnValue(mockToast)

    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Alice Wonderland' } } },
    })

    const { wrapper } = await mountLogin()
    await wrapper.find('input[type="email"]').setValue('a@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Alice'))
  })

  it('redirects to "/" after login when no redirect param', async () => {
    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Bob' } } },
    })

    const { wrapper, router } = await mountLogin()
    await wrapper.find('input[type="email"]').setValue('b@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects to the redirect query param after successful login', async () => {
    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Carol' } } },
    })

    const { wrapper, router } = await mountLogin({ redirect: '/booking' })
    await wrapper.find('input[type="email"]').setValue('c@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/booking')
  })

  // ── Open redirect protection ─────────────────────────────────────────────────

  it('BLOCKS absolute URL in redirect param (open redirect) — lands on "/"', async () => {
    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Eve' } } },
    })

    const { wrapper, router } = await mountLogin({ redirect: 'https://evil.com/phish' })
    await wrapper.find('input[type="email"]').setValue('e@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('BLOCKS protocol-relative URL (//evil.com) in redirect param — lands on "/"', async () => {
    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Mallory' } } },
    })

    const { wrapper, router } = await mountLogin({ redirect: '//evil.com' })
    await wrapper.find('input[type="email"]').setValue('m@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirect param "/login" resolves to "/" (no self-redirect loop)', async () => {
    customerLogin.mockResolvedValue({
      data: { data: { token: 'tok', customer: { name: 'Trent' } } },
    })

    const { wrapper, router } = await mountLogin({ redirect: '/login' })
    await wrapper.find('input[type="email"]').setValue('t@test.com')
    await wrapper.find('input[type="password"]').setValue('pass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  // ── Failed login ─────────────────────────────────────────────────────────────

  it('shows server error message on login failure', async () => {
    customerLogin.mockRejectedValue({
      response: { data: { message: 'Email atau password salah' } },
    })

    const { wrapper } = await mountLogin()
    await wrapper.find('input[type="email"]').setValue('x@test.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Email atau password salah')
  })

  it('shows a fallback error message when the server does not return one', async () => {
    customerLogin.mockRejectedValue(new Error('Network Error'))

    const { wrapper } = await mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Email atau password salah')
  })

  it('shows an error toast on login failure', async () => {
    const mockToast = { success: vi.fn(), error: vi.fn() }
    useToast.mockReturnValue(mockToast)

    customerLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })

    const { wrapper } = await mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalled()
  })

  it('re-enables the submit button after a failed login', async () => {
    customerLogin.mockRejectedValue(new Error('Bad'))

    const { wrapper } = await mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })
})
