import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BookingPriceSummary from '@/components/booking/BookingPriceSummary.vue'

const QUOTE = {
  available: true,
  base_price: 150000,
  flash_discount: 0,
  total_price: 120000,
  has_flash_sale: false,
  breakdown: [
    { time_range: '10:00-13:00', type: 'Normal Hour', description: 'Paket 3 Jam', amount: 100000 },
    { time_range: '13:00-14:00', type: 'Happy Hour',  description: '',            amount: 20000 },
  ],
}

const mountSummary = (props) => mount(BookingPriceSummary, { props: { quote: null, loading: false, error: '', voucherDiscount: 0, ...props } })
const rp = (n) => `Rp ${n.toLocaleString('id-ID')}`

describe('BookingPriceSummary', () => {
  it('renders one row per breakdown item with its amount', () => {
    const w = mountSummary({ quote: QUOTE })
    const rows = w.findAll('[data-breakdown-row]')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('10:00-13:00')
    expect(rows[0].text()).toContain('Paket 3 Jam')
    expect(rows[0].text()).toContain(rp(100000))
    expect(rows[1].text()).toContain('Happy Hour')
  })

  it('shows the server total_price as the total (not a sum of slots)', () => {
    const w = mountSummary({ quote: QUOTE })
    expect(w.find('[data-total]').text()).toContain(rp(120000))
    expect(w.text()).not.toContain('Estimasi')
  })

  it('strikes through base_price when there is a flash sale discount', () => {
    const w = mountSummary({ quote: { ...QUOTE, has_flash_sale: true, flash_sale_name: 'Flash 10.10', flash_discount: 30000 } })
    expect(w.find('s').text()).toContain(rp(150000))
    expect(w.text()).toContain('Flash 10.10')
  })

  it('labels the total as an estimate when a voucher is applied', () => {
    const w = mountSummary({ quote: QUOTE, voucherDiscount: 20000, voucherCode: 'HEMAT20' })
    expect(w.text()).toContain('HEMAT20')
    expect(w.text()).toContain(`- ${rp(20000)}`)
    expect(w.find('[data-total]').text()).toContain(rp(100000))
    expect(w.text()).toContain('Estimasi setelah voucher')
  })

  it('never shows a negative total when the voucher exceeds the price', () => {
    const w = mountSummary({ quote: QUOTE, voucherDiscount: 999999, voucherCode: 'X' })
    expect(w.find('[data-total]').text()).toContain(rp(0))
  })

  it('shows a skeleton while loading', () => {
    const w = mountSummary({ loading: true })
    expect(w.find('[data-quote-loading]').exists()).toBe(true)
    expect(w.find('[data-total]').exists()).toBe(false)
  })

  it('shows the server error as an alert', () => {
    const w = mountSummary({ error: 'Di luar jam operasional' })
    expect(w.find('[role="alert"]').text()).toContain('Di luar jam operasional')
  })

  it('warns when the slots are no longer available', () => {
    const w = mountSummary({ quote: { ...QUOTE, available: false } })
    expect(w.find('[role="alert"]').text()).toContain('Slot sudah tidak tersedia')
  })

  it('offers a retry button on error and emits retry', async () => {
    const w = mountSummary({ error: 'Gagal menghitung harga. Coba lagi.' })
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })
})
