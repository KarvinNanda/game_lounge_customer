import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PayBar from '@/components/flow/PayBar.vue'

const mountBar = (props) => mount(PayBar, { props: { label: 'Total', amount: 'Rp 50.000', actionLabel: 'Lanjut', ...props } })

describe('PayBar', () => {
  it('shows the amount in [data-total] and emits action', async () => {
    const w = mountBar()
    expect(w.find('[data-total]').text()).toBe('Rp 50.000')
    await w.find('button').trigger('click')
    expect(w.emitted('action')).toHaveLength(1)
  })

  it('disabled shows the hint and blocks the action', async () => {
    const w = mountBar({ disabled: true, hint: 'Lengkapi 2 langkah lagi' })
    expect(w.text()).toContain('Lengkapi 2 langkah lagi')
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })

  it('error shows a retry that emits retry', async () => {
    const w = mountBar({ error: true })
    const retry = w.findAll('button').find((b) => b.text().includes('Coba lagi'))
    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('sits above the bottom nav including the safe area, and hides on desktop', () => {
    const cls = mountBar().find('[data-pay-bar]').classes().join(' ')
    expect(cls).toContain('bottom-[calc(4rem+env(safe-area-inset-bottom))]')
    expect(cls).toContain('lg:hidden')
  })
  it('the disabled reason is ≥ 12px text and describes the button', () => {
    const w = mountBar({ disabled: true, hint: 'Lengkapi 2 langkah lagi' })
    const btn = w.find('[data-pay-bar] button')
    const hint = w.find(`#${btn.attributes('aria-describedby')}`)
    expect(hint.text()).toBe('Lengkapi 2 langkah lagi')
    expect(hint.classes()).toContain('text-xs')
  })
})

