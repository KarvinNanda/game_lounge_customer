import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/authApi', () => ({ getCustomerMe: vi.fn() }))
vi.mock('@/api/bookingApi', () => ({ getPublicStores: vi.fn(), getEventQuote: vi.fn(), initiateEventBooking: vi.fn() }))
import * as api from '@/api/bookingApi'
import EventBookingView from '@/views/EventBookingView.vue'

const ok = (data) => ({ data: { data } })
const quote = (available = true) => ok({ duration_hours: 4, price_per_day: 2400000, total_price: 401000, available })

const mountView = async () => {
  const pinia = createPinia(); setActivePinia(pinia)
  useAuthStore().setAuth({ name: 'A' })
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/event-booking'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push('/event-booking'); await router.isReady()
  const w = mount(EventBookingView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return w
}
const steps = (w) => w.findAll('section[data-step]')
const btn = (w, text) => w.findAll('button').find((b) => b.text().includes(text))
const toSchedule = async (w) => {
  await w.findAll('[role="radio"]').find((r) => r.text().includes('Bekasi')).trigger('click'); await flushPromises()
  await btn(w, 'Besok').trigger('click')
  await w.find('#event-start').setValue('14:00')
  await w.find('#event-end').setValue('18:00')
}

describe('EventBookingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getPublicStores.mockResolvedValue(ok([{ id: 's1', name: 'Bekasi' }]))
    api.getEventQuote.mockResolvedValue(quote())
  })

  it('branch → schedule → details → payment, showing the server total as the final price', async () => {
    const w = await mountView()
    await toSchedule(w)
    await btn(w, 'Cek ketersediaan').trigger('click'); await flushPromises()
    expect(steps(w)[1].text()).toContain('14:00–18:00')
    expect(steps(w)[2].attributes('data-open')).toBe('true')
    await w.find('#event-name').setValue('Ultah Budi')
    await btn(w, 'Lanjut').trigger('click')
    expect(steps(w)[3].attributes('data-open')).toBe('true')
    expect(w.text()).not.toContain('Estimasi')
    expect(w.find('[data-pay-bar]').text()).toContain('Rp 401.000')
  })

  it('shows a conflict inside the schedule step and does not advance', async () => {
    api.getEventQuote.mockResolvedValue(quote(false))
    const w = await mountView()
    await toSchedule(w)
    await btn(w, 'Cek ketersediaan').trigger('click'); await flushPromises()
    expect(steps(w)[1].find('[role="alert"]').text()).toContain('sudah dipakai')
    expect(steps(w)[1].attributes('data-open')).toBe('true')
  })

  it('offers a retry when the availability check fails', async () => {
    api.getEventQuote.mockRejectedValueOnce(new Error('timeout'))
    const w = await mountView()
    await toSchedule(w)
    await btn(w, 'Cek ketersediaan').trigger('click'); await flushPromises()
    await btn(w, 'Coba lagi').trigger('click'); await flushPromises()
    expect(steps(w)[2].attributes('data-open')).toBe('true')
  })

  it('shows the server message when the quote is rejected (400)', async () => {
    api.getEventQuote.mockRejectedValueOnce({ response: { status: 400, data: { message: 'harga event untuk cabang ini belum dikonfigurasi' } } })
    const w = await mountView()
    await toSchedule(w)
    await btn(w, 'Cek ketersediaan').trigger('click'); await flushPromises()
    expect(steps(w)[1].find('[role="alert"]').text()).toContain('harga event untuk cabang ini belum dikonfigurasi')
  })

  it('no longer warns that only the start date is checked for overnight events', async () => {
    const w = await mountView()
    await toSchedule(w)
    await w.find('#event-start').setValue('22:00')
    await w.find('#event-end').setValue('02:00')
    expect(w.text()).toContain('melewati tengah malam')
    expect(w.text()).not.toContain('dicek untuk tanggal mulai')
  })

  it('has labelled inputs and one h1', async () => {
    const w = await mountView()
    await toSchedule(w)
    for (const id of ['event-start', 'event-end']) expect(w.find(`label[for="${id}"]`).exists()).toBe(true)
    expect(w.findAll('h1')).toHaveLength(1)
  })

  it('clearing the event name after confirming reopens the detail step (no dead end)', async () => {
    const w = await mountView()
    await toSchedule(w)
    await btn(w, 'Cek ketersediaan').trigger('click'); await flushPromises()
    await w.find('#event-name').setValue('Ultah Budi')
    await btn(w, 'Lanjut').trigger('click')
    await steps(w)[2].find('button[aria-expanded="false"]').trigger('click')
    await w.find('#event-name').setValue('')
    await btn(w, 'Batal').trigger('click')
    expect(steps(w)[2].attributes('data-open')).toBe('true')
  })

  it('explains that start and end must differ', async () => {
    const w = await mountView()
    await toSchedule(w)
    await w.find('#event-end').setValue('14:00')
    expect(w.text()).toContain('Jam selesai harus berbeda')
    expect(btn(w, 'Cek ketersediaan').attributes('disabled')).toBeDefined()
  })
})
