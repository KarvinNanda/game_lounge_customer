import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'

let w
afterEach(() => { w?.unmount(); w = null })

const open = async (props = {}) => {
  w = mount(BaseSheet, {
    props: { modelValue: true, title: 'Pilih Voucher', ...props },
    slots: { default: '<button id="inside">A</button>' },
    attachTo: document.body,
  })
  await nextTick()
  return w
}
const dialog = () => document.body.querySelector('[role="dialog"]')

describe('BaseSheet', () => {
  it('renders an accessible modal dialog labelled by its title', async () => {
    await open({ description: '3 voucher tersedia' })
    const d = dialog()
    expect(d.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(d.getAttribute('aria-labelledby'))
    expect(title.textContent).toContain('Pilih Voucher')
    expect(d.textContent).toContain('3 voucher tersedia')
  })

  it('renders nothing when closed', async () => {
    await open({ modelValue: false })
    expect(dialog()).toBeNull()
  })

  it('closes on the close button, Escape and backdrop', async () => {
    await open()
    document.body.querySelector('button[aria-label="Tutup"]').click()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    document.body.querySelector('[data-sheet-backdrop]').click()
    expect(w.emitted('update:modelValue')).toEqual([[false], [false], [false]])
  })

  it('traps Tab inside the sheet', async () => {
    await open()
    const inside = document.getElementById('inside')
    inside.focus()
    inside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement.getAttribute('aria-label')).toBe('Tutup')
  })

  it('moves focus into the sheet when it opens', async () => {
    const trigger = document.createElement('button'); document.body.appendChild(trigger); trigger.focus()
    await open()
    await nextTick()
    expect(dialog().contains(document.activeElement)).toBe(true)
    trigger.remove()
  })
})
