import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('@/api/fnbApi', () => ({ getFnbMenu: vi.fn(), createFnbOrder: vi.fn() }))
import { getFnbMenu, createFnbOrder } from '@/api/fnbApi'
import FnbOrderView from '@/views/FnbOrderView.vue'

const MENU = [
  { id: 1, name: 'Minuman', items: [{ id: 11, name: 'Es Teh', price: 8000, image_url: '/uploads/teh.jpg' }, { id: 12, name: 'Kopi', price: 15000 }] },
  { id: 2, name: 'Makanan', items: [{ id: 21, name: 'Nasi Goreng', price: 25000 }] },
  { id: 3, name: 'Kosong',  items: [] },
]

let w
afterEach(() => { w?.unmount(); w = null })
const mountAt = async (url) => {
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/fnb-order', '/my-bookings', '/my-fnb-orders'].map((p) => ({ path: p, component: { template: '<div/>' } })) })
  await router.push(url); await router.isReady()
  w = mount(FnbOrderView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { w, router }
}
const add = (name) => w.find(`button[aria-label="Tambah ${name}"]`).trigger('click')

describe('FnbOrderView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getFnbMenu.mockResolvedValue({ data: { data: MENU } })
    createFnbOrder.mockResolvedValue({ data: { data: {} } })
  })

  it('without a booking, explains how to order instead of showing a cart that cannot be sent', async () => {
    await mountAt('/fnb-order')
    expect(w.text()).toContain('booking aktif')
    expect(w.find('a[href="/my-bookings"]').exists()).toBe(true)
    expect(w.find('button[aria-label="Tambah Es Teh"]').exists()).toBe(false)
  })

  it('caps room_info from the URL', async () => {
    await mountAt('/fnb-order?booking_id=101&room_info=' + 'X'.repeat(300))
    expect(w.text()).not.toContain('X'.repeat(100))
  })

  it('renders menu images through getImgUrl and hides empty categories', async () => {
    await mountAt('/fnb-order?booking_id=101')
    expect(w.find('img').attributes('src')).toBe('http://localhost:8080/uploads/teh.jpg')
    expect(w.text()).not.toContain('Kosong')
  })

  it('category chips filter the list (no horizontal scroll strip)', async () => {
    await mountAt('/fnb-order?booking_id=101')
    const chips = w.find('[aria-label="Kategori"]')
    expect(chips.classes()).toContain('flex-wrap')
    await chips.findAll('button').find((b) => b.text() === 'Makanan').trigger('click')
    expect(w.text()).toContain('Nasi Goreng')
    expect(w.text()).not.toContain('Es Teh')
  })

  it('adds items, shows the cart bar, and submits the order from the sheet', async () => {
    await mountAt('/fnb-order?booking_id=101')
    await add('Es Teh'); await add('Es Teh'); await add('Kopi')
    const bar = w.find('[data-cart-bar]')
    expect(bar.text()).toContain('3 item')
    expect(bar.text()).toContain('Rp 31.000')
    await bar.find('button').trigger('click'); await nextTick()
    const notes = document.body.querySelector('#fnb-notes')
    notes.value = 'tanpa es'; notes.dispatchEvent(new Event('input'))
    ;[...document.body.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes('Kirim pesanan')).click()
    await flushPromises()
    expect(createFnbOrder).toHaveBeenCalledWith({ booking_id: '101', notes: 'tanpa es', items: [{ item_id: 11, quantity: 2 }, { item_id: 12, quantity: 1 }] })
    expect(w.find('[role="status"]').text()).toContain('Pesanan Terkirim')
  })

  it('keeps the cart when sending fails', async () => {
    createFnbOrder.mockRejectedValue({ response: { data: { message: 'Booking sudah selesai' } } })
    await mountAt('/fnb-order?booking_id=101')
    await add('Kopi')
    await w.find('[data-cart-bar] button').trigger('click'); await nextTick()
    ;[...document.body.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes('Kirim pesanan')).click()
    await flushPromises()
    expect(toast.error).toHaveBeenCalledWith('Booking sudah selesai')
    expect(w.find('[data-cart-bar]').text()).toContain('1 item')
  })

  it('the cart bar sits above the BottomNav', async () => {
    await mountAt('/fnb-order?booking_id=101')
    await add('Kopi')
    expect(w.find('[data-cart-bar]').classes().join(' ')).toContain('bottom-[calc(4rem+env(safe-area-inset-bottom))]')
  })

  it('a failed menu load is an error with retry, not "menu belum tersedia"', async () => {
    getFnbMenu.mockRejectedValueOnce(new Error('timeout'))
    await mountAt('/fnb-order?booking_id=101')
    expect(w.find('[role="alert"]').text()).toContain('Gagal memuat menu')
    await w.findAll('button').find((b) => b.text().includes('Coba lagi')).trigger('click'); await flushPromises()
    expect(w.text()).toContain('Es Teh')
  })

  it('announces quantity changes with the item name in one live region', async () => {
    await mountAt('/fnb-order?booking_id=101')
    await add('Es Teh'); await add('Es Teh')
    const regions = w.findAll('[aria-live="polite"]')
    expect(regions).toHaveLength(1)
    expect(regions[0].text()).toBe('Es Teh: 2')
  })

  it('treats a malformed booking_id like a missing one', async () => {
    await mountAt('/fnb-order?booking_id=' + encodeURIComponent('<script>'))
    expect(w.text()).toContain('booking aktif')
  })
})
