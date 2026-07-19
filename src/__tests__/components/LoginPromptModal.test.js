import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import LoginPromptModal from '@/components/LoginPromptModal.vue'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))

const makeRouter = async (path = '/') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/',        component: { template: '<div/>' } },
      { path: '/login',   component: { template: '<div/>' } },
      { path: '/booking', component: { template: '<div/>' } },
      { path: '/profile', component: { template: '<div/>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return router
}

const mountModal = async (modelValue = true, path = '/') => {
  const pinia  = createPinia()
  setActivePinia(pinia)
  const router = await makeRouter(path)
  return mount(LoginPromptModal, {
    props: { modelValue },
    global: {
      plugins: [router, pinia],
      stubs: { Teleport: true, Transition: false },
    },
    attachTo: document.body,
  })
}

describe('LoginPromptModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Visibility ───────────────────────────────────────────────────────────────

  it('renders modal content when modelValue is true', async () => {
    const wrapper = await mountModal(true)
    expect(wrapper.text()).toContain('Login Dulu untuk Melanjutkan')
  })

  it('does not render modal content when modelValue is false', async () => {
    const wrapper = await mountModal(false)
    expect(wrapper.text()).not.toContain('Login Dulu untuk Melanjutkan')
  })

  // ── Close button ─────────────────────────────────────────────────────────────

  it('close button emits update:modelValue with false', async () => {
    const wrapper  = await mountModal(true)
    const closeBtn = wrapper.find('button')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })

  // ── Content ──────────────────────────────────────────────────────────────────

  it('renders the main heading', async () => {
    const wrapper = await mountModal(true)
    expect(wrapper.text()).toContain('Login Dulu untuk Melanjutkan')
  })

  it('renders the login button', async () => {
    const wrapper = await mountModal(true)
    expect(wrapper.text()).toContain('Login Sekarang')
  })

  it('renders the benefit cards', async () => {
    const wrapper = await mountModal(true)
    const text = wrapper.text()
    expect(text).toContain('Dapatkan promo eksklusif')
    expect(text).toContain('Simpan data & riwayat kamu')
  })

  it('renders exactly 2 benefit cards', async () => {
    const wrapper     = await mountModal(true)
    const benefitDivs = wrapper.findAll('[class*="bg-q-primary\\/10"]')
    expect(benefitDivs).toHaveLength(2)
  })

  // ── Redirect query: fallback to route.fullPath ────────────────────────────────

  it('login link includes redirect query based on current path when pendingPath is empty', async () => {
    const wrapper = await mountModal(true, '/booking')
    const loginLink = wrapper.find('a')
    const href = loginLink.attributes('href') || ''
    expect(href).toContain('redirect')
    expect(href).toContain('booking')
  })

  it('login link has no redirect query when current path is /login and pendingPath is empty', async () => {
    const wrapper = await mountModal(true, '/login')
    const loginLink = wrapper.find('a')
    const href = loginLink.attributes('href') || ''
    expect(href).not.toContain('redirect')
  })

  // ── Redirect query: pendingPath takes priority ────────────────────────────────

  it('login link uses authStore.pendingPath when set (overrides current route)', async () => {
    const pinia  = createPinia()
    setActivePinia(pinia)
    const router = await makeRouter('/') // current path is /
    const wrapper = mount(LoginPromptModal, {
      props: { modelValue: true },
      global: {
        plugins: [router, pinia],
        stubs: { Teleport: true, Transition: false },
      },
      attachTo: document.body,
    })

    // Set pendingPath to a protected route
    const authStore = useAuthStore()
    authStore.openAuthModal('/profile')
    await wrapper.vm.$nextTick()

    const href = wrapper.find('a').attributes('href') || ''
    expect(href).toContain('profile')
  })

  it('login link uses pendingPath even when current route has no redirect value', async () => {
    const pinia  = createPinia()
    setActivePinia(pinia)
    const router = await makeRouter('/login')
    const wrapper = mount(LoginPromptModal, {
      props: { modelValue: true },
      global: {
        plugins: [router, pinia],
        stubs: { Teleport: true, Transition: false },
      },
      attachTo: document.body,
    })

    const authStore = useAuthStore()
    authStore.openAuthModal('/my-bookings')
    await wrapper.vm.$nextTick()

    const href = wrapper.find('a').attributes('href') || ''
    expect(href).toContain('my-bookings')
  })

  // ── Open redirect protection ──────────────────────────────────────────────────

  it('DROPS redirect param when pendingPath is an external URL (open redirect)', async () => {
    const pinia  = createPinia()
    setActivePinia(pinia)
    const router = await makeRouter('/')
    const wrapper = mount(LoginPromptModal, {
      props: { modelValue: true },
      global: {
        plugins: [router, pinia],
        stubs: { Teleport: true, Transition: false },
      },
      attachTo: document.body,
    })

    const authStore = useAuthStore()
    authStore.openAuthModal('https://evil.com/phish')
    await wrapper.vm.$nextTick()

    const href = wrapper.find('a').attributes('href') || ''
    expect(href).not.toContain('evil.com')
  })
})
