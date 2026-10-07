import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import CustomerLayout from '@/layouts/CustomerLayout.vue'

vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))

describe('CustomerLayout', () => {
  it('reserves bottom space for the bottom nav plus the device safe area', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    await router.push('/'); await router.isReady()
    const w = mount(CustomerLayout, {
      global: { plugins: [router, pinia], stubs: { CustomerNavbar: true, BottomNav: true, LoginPromptModal: true } },
    })
    expect(w.find('main').classes().join(' ')).toContain('env(safe-area-inset-bottom)')
  })
})
