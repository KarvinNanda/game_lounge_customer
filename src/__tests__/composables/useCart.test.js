import { describe, it, expect } from 'vitest'
import { useCart } from '@/composables/useCart'

const TEH  = { id: 1, name: 'Es Teh', price: 8000 }
const KOPI = { id: 2, name: 'Kopi', price: 15000 }

describe('useCart', () => {
  it('adds items, counts quantities and totals the price', () => {
    const c = useCart()
    c.add(TEH); c.add(TEH); c.add(KOPI)
    expect(c.qty(1)).toBe(2)
    expect(c.count.value).toBe(3)
    expect(c.total.value).toBe(31000)
    expect(c.items.value.map((i) => [i.id, i.qty])).toEqual([[1, 2], [2, 1]])
  })
  it('removing the last unit drops the item', () => {
    const c = useCart()
    c.add(TEH); c.remove(TEH)
    expect(c.qty(1)).toBe(0)
    expect(c.items.value).toEqual([])
    c.remove(TEH) // tidak error / tidak minus
    expect(c.count.value).toBe(0)
  })
  it('toPayload maps to the API shape and clear() empties the cart', () => {
    const c = useCart()
    c.add(TEH); c.add(KOPI); c.add(KOPI)
    expect(c.toPayload()).toEqual([{ item_id: 1, quantity: 1 }, { item_id: 2, quantity: 2 }])
    c.clear()
    expect(c.count.value).toBe(0)
  })
})
