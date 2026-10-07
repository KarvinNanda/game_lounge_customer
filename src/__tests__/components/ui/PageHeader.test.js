import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'

const makeRouter = async () => {
  const r = createRouter({ history: createMemoryHistory(), routes: ['/', '/a', '/b'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await r.push('/a'); await r.push('/b'); await r.isReady()
  return r
}

describe('PageHeader', () => {
  it('renders the title as h1 and the subtitle', async () => {
    const w = mount(PageHeader, { props: { title: 'Booking Ruangan', subtitle: 'Pilih jam' }, global: { plugins: [await makeRouter()] } })
    expect(w.find('h1').text()).toBe('Booking Ruangan')
    expect(w.text()).toContain('Pilih jam')
    expect(w.find('button[aria-label="Kembali"]').exists()).toBe(false)
  })

  it('back=true goes back in history', async () => {
    const router = await makeRouter()
    const w = mount(PageHeader, { props: { title: 'T', back: true }, global: { plugins: [router] } })
    await w.find('button[aria-label="Kembali"]').trigger('click')
    await flushPromises(); await new Promise((r) => setTimeout(r, 0)); await flushPromises()
    expect(router.currentRoute.value.path).toBe('/a')
  })

  it('back="/path" navigates to that path', async () => {
    const router = await makeRouter()
    const w = mount(PageHeader, { props: { title: 'T', back: '/' }, global: { plugins: [router] } })
    await w.find('button[aria-label="Kembali"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('renders the actions slot', async () => {
    const w = mount(PageHeader, { props: { title: 'T' }, slots: { actions: '<button>Filter</button>' }, global: { plugins: [await makeRouter()] } })
    expect(w.text()).toContain('Filter')
  })
})
