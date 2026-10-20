import { describe, it, expect, vi } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useCheckoutStep } from '@/composables/useCheckoutStep'

const setup = async (path, ready) => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/booking', component: { template: '<div/>' } }] })
  await router.push(path); await router.isReady()
  let api
  const Host = defineComponent({ setup() { api = useCheckoutStep(ready); return () => h('div') } })
  mount(Host, { global: { plugins: [router] } })
  await flushPromises()
  return { router, api }
}

describe('useCheckoutStep', () => {
  it('open() pushes ?step=pay and keeps other query params', async () => {
    const { router, api } = await setup('/booking?store_id=s1', ref(true))
    api.open(); await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ store_id: 's1', step: 'pay' })
    expect(api.inCheckout.value).toBe(true)
  })

  it('drops ?step=pay when the flow is not ready (reload / deep link)', async () => {
    const { router, api } = await setup('/booking?step=pay&store_id=s1', ref(false))
    expect(router.currentRoute.value.query).toEqual({ store_id: 's1' })
    expect(api.inCheckout.value).toBe(false)
  })

  it('close() returns to the loadout', async () => {
    const { router, api } = await setup('/booking', ref(true))
    api.open(); await flushPromises()
    api.close(); await flushPromises()
    expect(router.currentRoute.value.query.step).toBeUndefined()
  })

  it('close() without a prior open (deep link) replaces instead of going back', async () => {
    const { router, api } = await setup('/booking?step=pay', ref(true))
    api.close(); await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/booking')
  })
  it('opening and closing the checkout scrolls to the top (query-only navigation keeps scrollY)', async () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { api } = await setup('/booking', ref(true))
    api.open(); await flushPromises()
    expect(spy).toHaveBeenCalledWith({ top: 0 })
    spy.mockClear()
    api.close(); await flushPromises()
    expect(spy).toHaveBeenCalledWith({ top: 0 })
    spy.mockRestore()
  })
})

