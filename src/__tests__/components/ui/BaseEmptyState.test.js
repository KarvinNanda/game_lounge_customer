import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Inbox } from 'lucide-vue-next'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'

describe('BaseEmptyState', () => {
  it('renders icon, title, text and actions', () => {
    const w = mount(BaseEmptyState, {
      props: { icon: Inbox, title: 'Belum ada booking', text: 'Yuk booking ruangan pertamamu.' },
      slots: { default: '<a href="/booking">Booking</a>' },
    })
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.find('h2').text()).toBe('Belum ada booking')
    expect(w.text()).toContain('Yuk booking')
    expect(w.find('a').attributes('href')).toBe('/booking')
  })
})
