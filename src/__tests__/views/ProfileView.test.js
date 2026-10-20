import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({
  getCustomerMe:          vi.fn(),
  updateCustomerProfile:  vi.fn(),
  changeCustomerPassword: vi.fn().mockResolvedValue({}),
  customerLogout:         vi.fn(),
}))

import ProfileView from '@/views/ProfileView.vue'

describe('ProfileView change password', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('tells the user that other devices were logged out', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    await router.push('/'); await router.isReady()
    const w = mount(ProfileView, { global: { plugins: [router, pinia] } })

    w.vm.passForm.old_password     = 'oldpass123'
    w.vm.passForm.new_password     = 'newpass123'
    w.vm.passForm.confirm_password = 'newpass123'
    await w.vm.handleChangePassword()
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Perangkat lain sudah dikeluarkan'))
  })
})

describe('ProfileView layout', () => {
  const mountProfile = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    await router.push('/'); await router.isReady()
    return mount(ProfileView, { global: { plugins: [router, pinia] } })
  }

  it('phone: tabs switch panels while both forms stay in the DOM', async () => {
    const w = await mountProfile()
    const tabs = w.find('[role="group"][aria-label="Bagian profil"]')
    expect(tabs.findAll('button').map((b) => b.text())).toEqual(['Data diri', 'Ganti password'])
    const dataPanel = () => w.find('form[aria-label="Data diri"]').element.closest('[data-panel]')
    const passPanel = () => w.find('form[aria-label="Ganti password"]').element.closest('[data-panel]')
    expect(dataPanel().style.display).not.toBe('none')
    expect(passPanel().style.display).toBe('none')
    await tabs.findAll('button')[1].trigger('click')
    expect(dataPanel().style.display).toBe('none')
    expect(passPanel().style.display).not.toBe('none')
    expect(w.find('#pass-old').exists()).toBe(true)
    expect(w.find('#profile-name').exists()).toBe(true)
  })

  it('shows the 3 social links', async () => {
    const w = await mountProfile()
    expect(w.findAll('a[target="_blank"]')).toHaveLength(3)
  })
})
