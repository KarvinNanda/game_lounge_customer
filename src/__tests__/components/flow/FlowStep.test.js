import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FlowStep from '@/components/flow/FlowStep.vue'

const mountStep = (props, body = '<button role="radio">Isi</button>') =>
  mount(FlowStep, { props: { index: 2, title: 'Pilih Ruangan', ...props }, slots: { default: body } })

describe('FlowStep', () => {
  it('active renders its title as h2 and its body', () => {
    const w = mountStep({ state: 'active' })
    expect(w.attributes('data-state')).toBe('active')
    expect(w.find('h2').text()).toContain('Pilih Ruangan')
    expect(w.find('[role="radio"]').exists()).toBe(true)
  })

  it('locked renders the hint, no body, and is aria-disabled', () => {
    const w = mountStep({ state: 'locked', lockedHint: 'Pilih cabang dulu' })
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.text()).toContain('Pilih cabang dulu')
    expect(w.find('[role="radio"]').exists()).toBe(false)
    expect(w.find('button').exists()).toBe(false)
  })

  it('done renders the summary and an Ubah button that emits edit', async () => {
    const w = mountStep({ state: 'done', summary: 'VIP Room' })
    expect(w.text()).toContain('VIP Room')
    expect(w.find('[role="radio"]').exists()).toBe(false)
    const ubah = w.find('button[aria-expanded="false"]')
    expect(ubah.text()).toBe('Ubah')
    await ubah.trigger('click')
    expect(w.emitted('edit')).toHaveLength(1)
  })

  it('done + expandDone also renders the body', () => {
    const w = mountStep({ state: 'done', summary: 'VIP Room', expandDone: true })
    expect(w.find('[role="radio"]').exists()).toBe(true)
  })

  it('cancelable active step shows Batal that emits cancel', async () => {
    const w = mountStep({ state: 'active', cancelable: true })
    await w.findAll('button').find((b) => b.text() === 'Batal').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })
  it('the Ubah button is a ≥ 44×44 target', () => {
    const cls = mountStep({ state: 'done', summary: 'VIP' }).find('button[aria-expanded="false"]').classes()
    expect(cls).toContain('min-h-11')
    expect(cls).toContain('min-w-11')
  })
})

