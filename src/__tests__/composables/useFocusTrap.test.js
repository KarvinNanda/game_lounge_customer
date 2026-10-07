import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const Dialog = defineComponent({
  props: { open: Boolean },
  setup(props) {
    const el = ref(null)
    useFocusTrap(el, () => props.open)
    return { el }
  },
  template: `
    <div>
      <button id="trigger">open</button>
      <div v-if="open" ref="el" role="dialog">
        <button id="first">close</button>
        <a id="middle" href="/x">link</a>
        <button id="last">login</button>
      </div>
    </div>`,
})

const tab = (shift = false) =>
  document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }))

let w
afterEach(() => w?.unmount())

const openFromTrigger = async () => {
  w = mount(Dialog, { props: { open: false }, attachTo: document.body })
  document.getElementById('trigger').focus()
  await w.setProps({ open: true })
  await nextTick()
}

describe('useFocusTrap', () => {
  it('wraps Tab from the last element to the first', async () => {
    await openFromTrigger()
    document.getElementById('last').focus()
    tab()
    expect(document.activeElement.id).toBe('first')
  })

  it('wraps Shift+Tab from the first element to the last', async () => {
    await openFromTrigger()
    document.getElementById('first').focus()
    tab(true)
    expect(document.activeElement.id).toBe('last')
  })

  it('pulls focus back inside when it is outside the dialog', async () => {
    await openFromTrigger()
    document.getElementById('trigger').focus()
    tab()
    expect(document.activeElement.id).toBe('first')
  })

  it('restores focus to the trigger when closed', async () => {
    await openFromTrigger()
    document.getElementById('last').focus()
    await w.setProps({ open: false })
    await nextTick()
    expect(document.activeElement.id).toBe('trigger')
  })

  it('restores focus to an outside trigger when unmounted while open', async () => {
    // Pemicu di luar komponen (seperti tombol nav yang membuka modal di layout)
    const outside = document.createElement('button')
    outside.id = 'outside-trigger'
    document.body.appendChild(outside)
    w = mount(Dialog, { props: { open: false }, attachTo: document.body })
    outside.focus()
    await w.setProps({ open: true })
    await nextTick()
    document.getElementById('last').focus()
    w.unmount()
    w = null
    expect(document.activeElement.id).toBe('outside-trigger')
    outside.remove()
  })
})
