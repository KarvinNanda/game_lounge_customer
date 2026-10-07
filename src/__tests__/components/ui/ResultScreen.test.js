import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultScreen from '@/components/ui/ResultScreen.vue'

const mk = (tone) => mount(ResultScreen, {
  props: { tone, title: 'Judul', message: 'Pesan' },
  slots: { default: '<p>detail</p>', actions: '<a href="/">Home</a>' },
})

describe('ResultScreen', () => {
  it.each([['success', 'status'], ['pending', 'status'], ['error', 'alert']])('%s uses role=%s', (tone, role) => {
    const w = mk(tone)
    expect(w.find(`[role="${role}"]`).exists()).toBe(true)
    expect(w.find('[data-tone]').attributes('data-tone')).toBe(tone)
    expect(w.find('svg').exists()).toBe(true)
  })

  it('renders title as h1, message, details and actions', () => {
    const w = mk('success')
    expect(w.find('h1').text()).toBe('Judul')
    expect(w.text()).toContain('Pesan')
    expect(w.text()).toContain('detail')
    expect(w.find('a').text()).toBe('Home')
  })
})
