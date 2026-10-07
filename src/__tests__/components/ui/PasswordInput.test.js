import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordInput from '@/components/ui/PasswordInput.vue'

describe('PasswordInput', () => {
  it('binds id/autocomplete, v-model, and toggles visibility with an accessible label', async () => {
    const w = mount(PasswordInput, { props: { id: 'pw', modelValue: '', autocomplete: 'new-password' } })
    const input = w.find('input')
    expect(input.attributes('id')).toBe('pw')
    expect(input.attributes('type')).toBe('password')
    expect(input.attributes('autocomplete')).toBe('new-password')
    await input.setValue('rahasia123')
    expect(w.emitted('update:modelValue')[0]).toEqual(['rahasia123'])
    // Label tetap + aria-pressed (bukan label yang berubah sekaligus aria-pressed)
    const toggle = w.find('button[aria-label="Tampilkan password"]')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    await toggle.trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
    expect(w.find('button[aria-label="Tampilkan password"]').attributes('aria-pressed')).toBe('true')
  })
})
