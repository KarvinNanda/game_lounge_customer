import { ref, computed } from 'vue'

/** Keranjang F&B sederhana: { [itemId]: { id, name, price, qty } } */
export const useCart = () => {
  const lines = ref({})

  const items = computed(() => Object.values(lines.value).filter((l) => l.qty > 0))
  const count = computed(() => items.value.reduce((n, l) => n + l.qty, 0))
  const total = computed(() => items.value.reduce((sum, l) => sum + l.price * l.qty, 0))

  const qty = (id) => lines.value[id]?.qty || 0

  const add = (item) => {
    lines.value[item.id] ??= { id: item.id, name: item.name, price: item.price, qty: 0 }
    lines.value[item.id].qty++
  }

  const remove = (item) => {
    const line = lines.value[item.id]
    if (!line) return
    line.qty--
    if (line.qty <= 0) delete lines.value[item.id]
  }

  const clear = () => { lines.value = {} }

  // Bentuk yang diminta POST /customer/fnb/orders
  const toPayload = () => items.value.map((l) => ({ item_id: l.id, quantity: l.qty }))

  return { items, count, total, qty, add, remove, clear, toPayload }
}
