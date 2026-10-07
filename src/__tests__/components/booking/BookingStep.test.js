import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BookingStep from '@/components/booking/BookingStep.vue'

const mk = (props) => mount(BookingStep, { props: { index: 2, title: 'Pilih Ruangan', ...props }, slots: { default: '<p id="body">isi</p>' } })

describe('BookingStep', () => {
  it('open step shows its body and no edit button', () => {
    const w = mk({ open: true })
    expect(w.find('#body').exists()).toBe(true)
    expect(w.find('button').exists()).toBe(false)
    expect(w.text()).toContain('2')
  })
  it('done + closed step collapses to a summary with an "Ubah" button', async () => {
    const w = mk({ open: false, done: true, summary: 'VIP Room' })
    expect(w.find('#body').exists()).toBe(false)
    const btn = w.find('button')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.text()).toContain('VIP Room')
    expect(btn.text()).toContain('Ubah')
    await btn.trigger('click')
    expect(w.emitted('edit')).toHaveLength(1)
  })
  it('upcoming step is closed, not clickable', () => {
    const w = mk({ open: false, done: false })
    expect(w.find('#body').exists()).toBe(false)
    expect(w.find('button').exists()).toBe(false)
  })
})
