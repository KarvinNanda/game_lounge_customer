<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6">
    <PageHeader title="My Bookings" subtitle="Jadwal dan riwayat booking kamu">
      <template #actions>
        <BaseButton to="/booking" size="sm">Booking</BaseButton>
      </template>
    </PageHeader>

    <BaseSegmented v-model="status" :options="FILTERS" label="Filter status" class="mb-4" />

    <div v-if="loading" class="space-y-2" aria-busy="true">
      <BaseSkeleton v-for="i in 4" :key="i" class="h-24" />
    </div>

    <BaseEmptyState
      v-else-if="!bookings.length"
      :icon="CalendarX"
      title="Belum ada booking"
      :text="status === 'all' ? 'Kamu belum pernah booking di Quantum.' : 'Tidak ada booking dengan status ini.'"
    >
      <BaseButton to="/booking">Booking sekarang</BaseButton>
    </BaseEmptyState>

    <ul v-else class="space-y-2">
      <li v-for="b in bookings" :key="b.id">
        <BaseCard class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="flex flex-wrap items-center gap-2">
                <span class="font-display text-sm font-semibold tracking-wide text-q-primary-l tabular-nums">{{ b.booking_code }}</span>
                <StatusBadge kind="booking" :status="b.status" />
              </p>
              <p class="mt-1 truncate text-sm font-semibold text-q-text">{{ b.store?.name }}</p>
              <p class="truncate text-xs text-q-text-3">{{ b.room?.room_template?.name }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm text-q-text">{{ formatDateShort(b.booking_date) }}</p>
              <p class="text-xs text-q-text-3 tabular-nums">{{ b.start_time?.slice(0, 5) }}–{{ b.end_time?.slice(0, 5) }}</p>
              <p class="mt-1 text-sm font-semibold text-q-gold tabular-nums">{{ formatRp(b.total_price) }}</p>
            </div>
          </div>
          <BaseButton
            v-if="b.status === 'ongoing'"
            :to="fnbLink(b)"
            variant="secondary"
            size="sm"
            block
            class="mt-3"
          >
            <UtensilsCrossed class="size-4" aria-hidden="true" /> Pesan makanan &amp; minuman
          </BaseButton>
        </BaseCard>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CalendarX, UtensilsCrossed } from 'lucide-vue-next'
import { getMyBookings } from '@/api/authApi'
import { formatRp, formatDateShort } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const FILTERS = [
  { label: 'Semua',          value: 'all' },
  { label: 'Akan datang',    value: 'upcoming' },
  { label: 'Sedang main',    value: 'ongoing' },
  { label: 'Hampir selesai', value: 'ending_soon' },
  { label: 'Selesai',        value: 'completed' },
  { label: 'Dibatalkan',     value: 'cancelled' },
]

const bookings = ref([])
const loading  = ref(true)
const status   = ref('all')

let seq = 0 // ganti filter cepat-cepat: response filter lama yang telat datang diabaikan

const fetchBookings = async () => {
  const mySeq = ++seq
  loading.value = true
  try {
    const { data } = await getMyBookings(status.value === 'all' ? {} : { status: status.value })
    if (mySeq === seq) bookings.value = data.data || []
  } catch {
    if (mySeq === seq) bookings.value = []
  } finally {
    if (mySeq === seq) loading.value = false
  }
}

const fnbLink = (b) => ({
  path:  '/fnb-order',
  query: { booking_id: b.id, room_info: `${b.store?.name || ''} — ${b.room?.room_template?.name || ''}` },
})

watch(status, fetchBookings)
onMounted(fetchBookings)
</script>
