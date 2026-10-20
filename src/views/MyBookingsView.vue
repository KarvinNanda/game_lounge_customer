<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6">
    <PageHeader title="My Bookings" subtitle="Jadwal dan riwayat booking kamu">
      <template #actions>
        <BaseButton to="/booking" size="sm"><Plus class="size-4" aria-hidden="true" /> Booking</BaseButton>
      </template>
    </PageHeader>

    <BaseSegmented v-model="status" :options="FILTERS" label="Filter status" class="mb-4" />

    <div v-if="loading" class="grid gap-2 lg:grid-cols-2" aria-busy="true">
      <BaseSkeleton v-for="i in 4" :key="i" class="h-[84px]" />
    </div>

    <BaseEmptyState
      v-else-if="!bookings.length"
      :icon="CalendarX"
      title="Belum ada booking"
      :text="status === 'all' ? 'Kamu belum pernah booking di Quantum.' : 'Tidak ada booking dengan status ini.'"
    >
      <BaseButton to="/booking">Booking sekarang</BaseButton>
    </BaseEmptyState>

    <ul v-else class="grid gap-2 lg:grid-cols-2">
      <li v-for="b in bookings" :key="b.id">
        <HudPanel :tone="b.status === 'ongoing' ? 'active' : 'default'" class="flex h-full items-stretch gap-3 p-2.5">
          <!-- Blok tanggal -->
          <div class="hud-cut-sm flex w-14 shrink-0 flex-col items-center justify-center bg-q-card2/70 py-1.5 text-center">
            <span class="font-display text-xl leading-none text-q-text tabular-nums">{{ dayOf(b.booking_date) }}</span>
            <span class="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-q-text-3">{{ monthOf(b.booking_date) }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p class="truncate text-sm font-semibold text-q-text">{{ b.room?.room_template?.name }}</p>
              <StatusBadge kind="booking" :status="b.status" />
            </div>
            <p class="truncate text-xs text-q-text-3">{{ b.store?.name }}</p>
            <p class="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
              <span class="font-mono text-q-text-2 tabular-nums">{{ b.start_time?.slice(0, 5) }}–{{ b.end_time?.slice(0, 5) }}</span>
              <span class="font-mono text-q-primary-l">{{ b.booking_code }}</span>
              <span class="ml-auto font-semibold text-q-gold tabular-nums">{{ formatRp(b.total_price) }}</span>
            </p>
            <BaseButton
              v-if="b.status === 'ongoing'"
              :to="fnbOrderLink(b)"
              size="sm"
              block
              class="mt-2"
            >
              <UtensilsCrossed class="size-4" aria-hidden="true" /> Pesan F&amp;B
            </BaseButton>
          </div>
        </HudPanel>
      </li>
    </ul>

    <p v-if="loadMoreError" role="alert" class="mt-3 text-center text-sm text-q-red">Gagal memuat booking berikutnya.</p>
    <BaseButton
      v-if="!loading && hasMore"
      variant="secondary"
      block
      class="mt-3"
      :loading="loadingMore"
      @click="loadMore"
    >
      Muat lagi
    </BaseButton>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CalendarX, UtensilsCrossed, Plus } from 'lucide-vue-next'
import { getMyBookings } from '@/api/authApi'
import { formatRp, formatDateShort } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import { fnbOrderLink } from '@/utils/fnb'
import { parseLocalDate } from '@/utils/dates'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

// Filter dan pagination di server: GET /customer/bookings?page&per_page&status
// "Aktif" = akan datang + sedang main (backend menerima daftar status dipisah koma)
const FILTERS = [
  { label: 'Semua',   value: 'all' },
  { label: 'Aktif',   value: 'upcoming,ongoing' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Batal',   value: 'cancelled' },
]
const PER_PAGE = 20

const bookings      = ref([])
const loading       = ref(true)
const loadingMore   = ref(false)
const loadMoreError = ref(false)
const status        = ref('all')
const page          = ref(1)
const hasMore       = ref(false)

// Ganti filter saat request lama masih jalan → respons lama dibuang
let seq = 0

const fetchPage = async (nextPage) => {
  const mySeq  = seq
  const params = { page: nextPage, per_page: PER_PAGE }
  if (status.value !== 'all') params.status = status.value
  const { data } = await getMyBookings(params)
  if (mySeq !== seq) return null
  page.value    = nextPage
  hasMore.value = (data.meta?.page ?? nextPage) < (data.meta?.total_page ?? 0)
  return data.data || []
}

const fetchBookings = async () => {
  seq++
  const mySeq = seq
  loading.value       = true
  loadingMore.value   = false // "Muat lagi" milik filter lama tidak boleh mengunci tombol filter baru
  loadMoreError.value = false
  hasMore.value       = false
  try {
    const rows = await fetchPage(1)
    if (rows) bookings.value = rows
  } catch {
    if (mySeq === seq) bookings.value = []
  } finally {
    if (mySeq === seq) loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value) return // dua klik sebelum tombol sempat disabled
  const mySeq = seq
  loadingMore.value   = true
  loadMoreError.value = false
  try {
    const rows = await fetchPage(page.value + 1)
    if (rows) bookings.value = [...bookings.value, ...rows]
  } catch {
    if (mySeq === seq) loadMoreError.value = true
  } finally {
    if (mySeq === seq) loadingMore.value = false
  }
}

watch(status, fetchBookings)

const dayOf   = (d) => parseLocalDate(String(d ?? '').slice(0, 10))?.getDate() ?? '—'
const monthOf = (d) => parseLocalDate(String(d ?? '').slice(0, 10))?.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '') ?? ''

onMounted(fetchBookings)
</script>
