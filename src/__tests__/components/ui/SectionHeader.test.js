import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/',        component: { template: '<div/>' } },
    { path: '/booking', component: { template: '<div/>' } },
  ],
})

describe('SectionHeader', () => {
  it('renders the title as h2', () => {
    const w = mount(SectionHeader, { props: { title: 'Rekomendasi Ruangan' }, global: { plugins: [router] } })
    expect(w.find('h2').text()).toBe('Rekomendasi Ruangan')
    expect(w.find('a').exists()).toBe(false)
  })
  it('renders the "Lihat semua" link when `to` is set', () => {
    const w = mount(SectionHeader, { props: { title: 'T', to: '/booking' }, global: { plugins: [router] } })
    expect(w.find('a').attributes('href')).toBe('/booking')
    expect(w.find('a').text()).toContain('Lihat semua')
  })
})
