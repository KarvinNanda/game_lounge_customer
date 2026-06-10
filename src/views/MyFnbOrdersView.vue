<template>
  <div class="max-w-2xl mx-auto px-4 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-2xl font-bold text-white">Pesanan FnB Saya</h1>
        <p class="text-[#6B7280] text-sm mt-0.5">Status pesanan makanan & minuman kamu</p>
      </div>
      <div v-if="orders.length" class="bg-[#0282DE]/20 text-[#19B9EE] text-xs font-bold px-3 py-1.5 rounded-full">
        {{ orders.length }} Pesanan
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3 mt-6">
      <div v-for="i in 3" :key="i" class="h-28 bg-[#11111E] rounded-2xl animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!orders.length" class="text-center py-16">
      <div class="text-5xl mb-3">🍽️</div>
      <div class="text-white font-bold mb-1">Belum ada pesanan FnB</div>
      <p class="text-[#9CA3AF] text-sm">Pesan makan & minum saat sesi bermain aktif.</p>
    </div>

    <!-- Orders list -->
    <div v-else class="space-y-3 mt-5">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-[#11111E] border border-[#252540] rounded-2xl p-4"
      >
        <!-- Header row -->
        <div class="flex items-center justify-between mb-3">
          <div class="text-[#6B7280] text-xs">
            {{ formatDateTime(order.created_at) }}
          </div>
          <span
            class="text-xs font-bold px-2.5 py-1 rounded-full"
            :class="statusStyle(order.status)"
          >
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- Items list -->
        <div class="space-y-1 mb-3">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex justify-between text-sm"
          >
            <span class="text-[#9CA3AF]">{{ item.item_name }} ×{{ item.quantity }}</span>
            <span class="text-white">Rp {{ formatRp(item.price * item.quantity) }}</span>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="order.notes" class="text-[#6B7280] text-xs mb-2">
          📝 {{ order.notes }}
        </div>

        <!-- Total footer -->
        <div class="flex justify-between pt-2 border-t border-[#252540]">
          <span class="text-[#6B7280] text-xs">Total (bayar di kasir)</span>
          <span class="text-[#0282DE] font-bold text-sm">
            Rp {{ formatRp(order.total_amount) }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyFnbOrders } from '@/api/fnbApi'

const orders  = ref([])
const loading = ref(true)

const STATUS_LABELS = {
  pending:   '⏳ Menunggu',
  preparing: '🍳 Disiapkan',
  delivered: '✅ Diantar',
  cancelled: '❌ Dibatalkan',
}

const STATUS_STYLES = {
  pending:   'bg-amber-500/20 text-amber-400',
  preparing: 'bg-blue-500/20 text-blue-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

const statusLabel = (s) => STATUS_LABELS[s] || s
const statusStyle = (s) => STATUS_STYLES[s]  || 'bg-[#252540] text-[#9CA3AF]'

const formatRp = (p) => Math.round(p || 0).toLocaleString('id-ID')

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('id-ID', {
        day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

onMounted(async () => {
  try {
    const { data } = await getMyFnbOrders()
    orders.value = data.data || []
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }
})
</script>
