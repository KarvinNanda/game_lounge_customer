<template>
  <div class="max-w-2xl mx-auto px-4 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-white">My Bookings</h1>
        <p class="text-[#9CA3AF] text-sm mt-0.5">Riwayat dan jadwal booking kamu</p>
      </div>
      <div v-if="bookings.length" class="bg-[#0282DE]/20 text-[#19B9EE] text-xs font-bold px-3 py-1.5 rounded-full">
        {{ bookings.length }} Booking
      </div>
    </div>

    <!-- Filter pills -->
    <div class="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <button
        v-for="s in STATUS_FILTERS"
        :key="s.value"
        @click="selectedStatus = s.value; fetchBookings()"
        class="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all flex-shrink-0"
        :class="selectedStatus === s.value
          ? 'bg-[#0282DE] border-[#0282DE] text-white'
          : 'bg-[#11111E] border-[#252540] text-[#9CA3AF] hover:border-[#0282DE]'"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 bg-[#11111E] rounded-xl animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!bookings.length" class="text-center py-16">
      <div class="text-5xl mb-4">📅</div>
      <div class="text-white font-bold mb-1">Belum ada booking</div>
      <p class="text-[#9CA3AF] text-sm mb-5">
        {{ selectedStatus === 'all' ? 'Kamu belum pernah booking di Quantum.' : `Tidak ada booking dengan status ini.` }}
      </p>
      <RouterLink to="/booking">
        <button class="px-5 py-2.5 bg-[#0282DE] text-white font-bold rounded-xl text-sm">Booking Sekarang</button>
      </RouterLink>
    </div>

    <!-- Booking list -->
    <div v-else class="bg-[#11111E] border border-[#252540] rounded-2xl overflow-hidden">

      <!-- Column header -->
      <div class="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-[#252540] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
        <span>Booking</span>
        <span class="text-center">Jadwal</span>
        <span class="text-right">Total</span>
      </div>

      <!-- Scrollable rows -->
      <div class="overflow-y-auto max-h-[480px] divide-y divide-[#1E1E30]">
        <div
          v-for="b in bookings"
          :key="b.id"
          class="px-4 py-3 hover:bg-[#181828] transition-colors"
        >
          <!-- Main row: booking info | jadwal | total -->
          <div class="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
            <!-- Left: code + store + room + status -->
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[#0282DE] text-[11px] font-bold tracking-wider">{{ b.booking_code }}</span>
                <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" :class="statusStyle(b.status)">
                  {{ statusLabel(b.status) }}
                </span>
              </div>
              <div class="text-white text-sm font-semibold truncate mt-0.5">{{ b.store?.name }}</div>
              <div class="text-[#6B7280] text-[11px] truncate">{{ b.room?.room_template?.name }}</div>
            </div>

            <!-- Center: date + time -->
            <div class="flex-shrink-0 text-center">
              <div class="text-white text-xs font-medium">{{ formatDateShort(b.booking_date) }}</div>
              <div class="text-[#9CA3AF] text-[11px]">{{ b.start_time?.slice(0,5) }}–{{ b.end_time?.slice(0,5) }}</div>
            </div>

            <!-- Right: price -->
            <div class="flex-shrink-0 text-right">
              <span class="text-[#19B9EE] text-xs font-bold">{{ formatRp(b.total_price) }}</span>
            </div>
          </div>

          <!-- FnB order button — only for ongoing bookings -->
          <div v-if="b.status === 'ongoing'" class="mt-3 pt-3 border-t border-[#1E1E30]">
            <RouterLink
              :to="`/fnb-order?booking_id=${b.id}&room_info=${encodeURIComponent((b.store?.name || '') + ' — ' + (b.room?.room_template?.name || ''))}`"
            >
              <button
                class="w-full py-2.5 bg-[#0282DE]/10 border border-[#0282DE]/30
                       text-[#0282DE] text-sm font-semibold rounded-xl
                       hover:bg-[#0282DE] hover:text-white transition-all
                       flex items-center justify-center gap-2"
              >
                🍽️ Pesan Makanan & Minuman
              </button>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Footer hint -->
      <div v-if="bookings.length > 6" class="px-4 py-2 border-t border-[#252540] text-center text-[11px] text-[#6B7280]">
        Scroll untuk lihat semua booking
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink }     from 'vue-router'
import { getMyBookings }  from '@/api/authApi'

const bookings       = ref([])
const loading        = ref(true)
const selectedStatus = ref('all')

const STATUS_FILTERS = [
  { label: 'Semua',       value: 'all'         },
  { label: '🟡 Upcoming', value: 'upcoming'    },
  { label: '🟢 Ongoing',  value: 'ongoing'     },
  { label: '🔴 Ending',   value: 'ending_soon' },
  { label: '✅ Selesai',  value: 'completed'   },
  { label: '❌ Batal',    value: 'cancelled'   },
]

const STATUS_STYLES = {
  upcoming:    'bg-blue-500/20 text-blue-400',
  ongoing:     'bg-green-500/20 text-green-400',
  ending_soon: 'bg-orange-500/20 text-orange-400',
  completed:   'bg-[#252540] text-[#9CA3AF]',
  cancelled:   'bg-red-500/20 text-red-400',
}

const STATUS_LABELS = {
  upcoming:    'Upcoming',
  ongoing:     'Ongoing',
  ending_soon: 'Ending Soon',
  completed:   'Selesai',
  cancelled:   'Dibatalkan',
}

const fetchBookings = async () => {
  loading.value = true
  try {
    const params = selectedStatus.value !== 'all' ? { status: selectedStatus.value } : {}
    const { data } = await getMyBookings(params)
    bookings.value = data.data || []
  } catch {
    bookings.value = []
  } finally {
    loading.value = false
  }
}

const statusStyle = (s) => STATUS_STYLES[s] || 'bg-[#252540] text-[#9CA3AF]'
const statusLabel = (s) => STATUS_LABELS[s] || s

const formatDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'

const formatRp = (p) => 'Rp ' + Math.round(p || 0).toLocaleString('id-ID')

onMounted(fetchBookings)
</script>
