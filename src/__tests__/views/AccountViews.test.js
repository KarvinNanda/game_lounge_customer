import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({
  getCustomerMe: vi.fn(), getMyVouchers: vi.fn(),
  updateCustomerProfile: vi.fn(), changeCustomerPassword: vi.fn(), customerLogout: vi.fn(),
}))
vi.mock('@/api/bannerApi', () => ({ getBannerById: vi.fn() }))
vi.mock('@/api/index', () => ({ publicApi: { get: vi.fn(), post: vi.fn() }, default: { get: vi.fn(), post: vi.fn() } }))

import { getMyVouchers, changeCustomerPassword } from '@/api/authApi'
import { getBannerById } from '@/api/bannerApi'
import { publicApi } from '@/api/index'
import PromoView from '@/views/PromoView.vue'
import BannerDetailView from '@/views/banner/BannerDetailView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'

const ok = (data) => ({ data: { data } })
let router
const mountAt = async (component, url = '/', customer = { name: 'Alice', type: 'member' }) => {
  const pinia = createPinia(); setActivePinia(pinia)
  if (customer) useAuthStore().setAuth(customer)
  router = createRouter({ history: createMemoryHistory(), routes: [
    ...['/', '/booking', '/login', '/forgot-password', '/promo'].map((p) => ({ path: p, component: { template: '<div/>' } })),
    { path: '/banner/:id', component: { template: '<div/>' } },
    { path: '/reset-password/:token', component: { template: '<div/>' } },
  ] })
  await router.push(url); await router.isReady()
  const w = mount(component, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}

describe('PromoView', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 8, 12)) })
  afterEach(() => { vi.useRealTimers() })

  it('non-members are told vouchers are member-only (backend returns [] for them)', async () => {
    getMyVouchers.mockResolvedValue(ok([]))
    const w = await mountAt(PromoView, '/promo', { name: 'Bob', type: 'regular' })
    expect(w.text()).toContain('khusus member')
  })

  it('members see vouchers with discount, code, expiry and a booking CTA', async () => {
    getMyVouchers.mockResolvedValue(ok([
      { voucher_id: 'v1', name: 'Hemat 10%', code: 'HEMAT10', discount_type: 'percentage', discount_value: 10, min_purchase: 50000, valid_until: '2026-10-11T23:59:00+07:00' },
      { voucher_id: 'v2', name: 'Lama', code: 'OLD', discount_type: 'fixed', discount_value: 5000, valid_until: '2026-10-01T00:00:00+07:00' },
    ]))
    const w = await mountAt(PromoView, '/promo')
    expect(w.text()).toContain('10% off')
    expect(w.text()).toContain('HEMAT10')
    expect(w.text()).toContain('min Rp 50.000')
    expect(w.text()).toContain('3 hari lagi')
    expect(w.text()).toContain('Kedaluwarsa')
    expect(w.text()).not.toMatch(/-\d+ ?h/)
    expect(w.find('a[href="/booking"]').exists()).toBe(true)
  })

  it('copy button copies the voucher code', async () => {
    getMyVouchers.mockResolvedValue(ok([{ voucher_id: 'v1', name: 'H', code: 'HEMAT10', discount_type: 'fixed', discount_value: 1000 }]))
    const w = await mountAt(PromoView, '/promo')
    await w.find('button[aria-label="Salin kode HEMAT10"]').trigger('click'); await flushPromises()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('HEMAT10')
  })
})

describe('BannerDetailView', () => {
  beforeEach(() => { vi.clearAllMocks(); getBannerById.mockResolvedValue(ok({ id: 1, title: 'Grand Opening', subtitle: 'Diskon 50%', description: 'Detail promo', image_url: '', detail_image_url: null })) })

  it('renders the banner without a broken image', async () => {
    const w = await mountAt(BannerDetailView, '/banner/1')
    expect(w.find('h1').text()).toBe('Grand Opening')
    expect(w.text()).toContain('Detail promo')
    expect(w.find('img').exists()).toBe(false)
  })

  it('guests use the global login modal (no second modal on the page)', async () => {
    const w = await mountAt(BannerDetailView, '/banner/1', null)
    const spy = vi.spyOn(useAuthStore(), 'openAuthModal')
    await w.findAll('button').find((b) => b.text().includes('Booking')).trigger('click')
    expect(spy).toHaveBeenCalledWith('/booking')
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(0)
  })

  it('logged-in users go to booking', async () => {
    const w = await mountAt(BannerDetailView, '/banner/1')
    await w.findAll('a, button').find((b) => b.text().includes('Booking')).trigger('click'); await flushPromises()
    expect(router.currentRoute.value.path).toBe('/booking')
  })

  it('not found state', async () => {
    getBannerById.mockRejectedValue(new Error('404'))
    const w = await mountAt(BannerDetailView, '/banner/9')
    expect(w.text()).toContain('Promo tidak ditemukan')
  })
})

describe('ProfileView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('labels every field and uses password inputs with the right autocomplete', async () => {
    const w = await mountAt(ProfileView)
    for (const id of ['profile-name', 'profile-whatsapp', 'pass-old', 'pass-new', 'pass-confirm']) {
      expect(w.find(`label[for="${id}"]`).exists()).toBe(true)
      expect(w.find(`#${id}`).exists()).toBe(true)
    }
    expect(w.find('#pass-old').attributes('autocomplete')).toBe('current-password')
    expect(w.find('#pass-new').attributes('autocomplete')).toBe('new-password')
  })

  it('password errors are announced and do not call the API', async () => {
    const w = await mountAt(ProfileView)
    await w.find('#pass-old').setValue('lama12345')
    await w.find('#pass-new').setValue('pendek')
    await w.find('#pass-confirm').setValue('pendek')
    await w.find('form[aria-label="Ganti password"]').trigger('submit'); await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain('minimal 8')
    expect(changeCustomerPassword).not.toHaveBeenCalled()
  })
})

describe('ForgotPasswordView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('always shows the same success message (does not reveal whether the email exists)', async () => {
    publicApi.post.mockRejectedValue({ response: { status: 404 } })
    const w = await mountAt(ForgotPasswordView, '/forgot-password', null)
    expect(w.find('#forgot-email').attributes('autocomplete')).toBe('email')
    await w.find('#forgot-email').setValue('siapa@contoh.com')
    await w.find('form').trigger('submit'); await flushPromises()
    expect(publicApi.post).toHaveBeenCalledWith('/customer/forgot-password', { email: 'siapa@contoh.com' })
    expect(w.find('[role="status"]').text()).toContain('Jika email terdaftar')
  })

  it('blocks an invalid email without calling the API', async () => {
    const w = await mountAt(ForgotPasswordView, '/forgot-password', null)
    await w.find('#forgot-email').setValue('bukan-email')
    await w.find('form').trigger('submit'); await flushPromises()
    expect(publicApi.post).not.toHaveBeenCalled()
    expect(w.find('[role="alert"]').exists()).toBe(true)
  })
})

describe('ResetPasswordView', () => {
  beforeEach(() => { vi.clearAllMocks(); publicApi.get.mockResolvedValue({}); publicApi.post.mockResolvedValue({}) })

  it('encodes the token in the API path', async () => {
    await mountAt(ResetPasswordView, '/reset-password/' + encodeURIComponent('../admin'), null)
    expect(publicApi.get).toHaveBeenCalledWith('/customer/reset-password/..%2Fadmin/validate')
  })

  it('enforces 8+ characters and matching confirmation before calling the API', async () => {
    const w = await mountAt(ResetPasswordView, '/reset-password/tok', null)
    await w.find('#reset-new').setValue('pendek')
    await w.find('#reset-confirm').setValue('pendek')
    await w.find('form').trigger('submit'); await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain('minimal 8')
    expect(publicApi.post).not.toHaveBeenCalled()
    expect(w.find('#reset-new').attributes('autocomplete')).toBe('new-password')
  })

  it('invalid token offers to request a new link', async () => {
    publicApi.get.mockRejectedValue({ response: { status: 400 } })
    const w = await mountAt(ResetPasswordView, '/reset-password/tok', null)
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.find('a[href="/forgot-password"]').exists()).toBe(true)
  })

  it('success links back to login', async () => {
    const w = await mountAt(ResetPasswordView, '/reset-password/tok', null)
    await w.find('#reset-new').setValue('passwordbaru1')
    await w.find('#reset-confirm').setValue('passwordbaru1')
    await w.find('form').trigger('submit'); await flushPromises()
    expect(publicApi.post).toHaveBeenCalledWith('/customer/reset-password/tok', { new_password: 'passwordbaru1', confirm_password: 'passwordbaru1' })
    expect(w.find('a[href="/login"]').exists()).toBe(true)
  })
})
