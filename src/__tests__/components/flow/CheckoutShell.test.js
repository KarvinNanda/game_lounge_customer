import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckoutShell from '@/components/flow/CheckoutShell.vue'

describe('CheckoutShell', () => {
  it('screen mode: full-screen section with a back button that emits close', async () => {
    const w = mount(CheckoutShell, { props: { title: 'Pembayaran', mode: 'screen' }, slots: { default: '<p>isi</p>' } })
    expect(w.find('[data-checkout="screen"]').exists()).toBe(true)
    expect(w.find('h2').text()).toBe('Pembayaran')
    await w.find('button[aria-label="Kembali ke pilihan"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.text()).toContain('isi')
  })

  it('panel mode: sticky aside with slot and footer, no back button', () => {
    const w = mount(CheckoutShell, {
      props: { title: 'Ringkasan', mode: 'panel' },
      slots: { default: '<p>isi</p>', footer: '<button>Bayar</button>' },
    })
    expect(w.find('aside[data-checkout="panel"]').exists()).toBe(true)
    expect(w.find('button[aria-label="Kembali ke pilihan"]').exists()).toBe(false)
    expect(w.text()).toContain('Bayar')
  })
})
