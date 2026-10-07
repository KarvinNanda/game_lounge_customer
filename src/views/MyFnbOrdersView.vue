<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6">
    <PageHeader title="Pesanan F&B" subtitle="Status pesanan makanan & minuman kamu" back />

    <div v-if="loading" class="space-y-2" aria-busy="true">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-28" />
    </div>

    <BaseEmptyState v-else-if="!orders.length" :icon="UtensilsCrossed" title="Belum ada pesanan" text="Pesan F&B dari booking yang sedang berjalan di My Bookings.">
      <BaseButton to="/my-bookings" variant="secondary">Ke My Bookings</BaseButton>
    </BaseEmptyState>

    <ul v-else class="space-y-2">
      <li v-for="order in orders" :key="order.id">
        <BaseCard class="p-4">
          <div class="mb-2 flex items-center justify-between gap-3">
            <span class="text-xs text-q-text-3">{{ formatDateTime(order.created_at) }}</span>
            <StatusBadge kind="fnb" :status="order.status" />
          </div>
          <ul class="space-y-1 text-sm">
            <li v-for="item in order.items" :key="item.id" class="flex justify-between gap-3">
              <span class="text-q-text">{{ item.quantity }}× {{ item.item_name }}</span>
              <span class="text-q-text-2 tabular-nums">{{ formatRp(item.price * item.quantity) }}</span>
            </li>
          </ul>
          <p v-if="order.notes" class="mt-2 flex gap-1.5 text-xs text-q-text-3">
            <NotebookPen class="size-3.5 shrink-0" aria-hidden="true" /> {{ order.notes }}
          </p>
          <div class="mt-3 flex justify-between border-t border-border-subtle pt-2 text-sm">
            <span class="text-q-text-3">Total · bayar di kasir</span>
            <span class="font-semibold text-q-gold tabular-nums">{{ formatRp(order.total_amount) }}</span>
          </div>
        </BaseCard>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UtensilsCrossed, NotebookPen } from 'lucide-vue-next'
import { getMyFnbOrders } from '@/api/fnbApi'
import { formatRp } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const orders  = ref([])
const loading = ref(true)

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

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
