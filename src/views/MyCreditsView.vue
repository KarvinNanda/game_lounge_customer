<template>
  <div class="max-w-2xl mx-auto px-4 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Play Credits</h1>
        <p class="text-[#9CA3AF] text-sm mt-0.5">Paket credits yang kamu miliki</p>
      </div>
      <RouterLink to="/credits">
        <button class="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-full transition-colors">
          + Beli Credits
        </button>
      </RouterLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-14 bg-[#11111E] rounded-xl animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!credits.length" class="text-center py-16">
      <div class="text-5xl mb-4">🎮</div>
      <div class="text-white font-bold mb-2">Belum ada Play Credits</div>
      <p class="text-[#9CA3AF] text-sm mb-5">Beli paket credits dan hemat lebih banyak saat booking.</p>
      <RouterLink to="/credits">
        <button class="px-5 py-2.5 bg-[#7C3AED] text-white font-bold rounded-xl text-sm">Beli Credits Sekarang</button>
      </RouterLink>
    </div>

    <!-- Credits list -->
    <div v-else class="bg-[#11111E] border border-[#252540] rounded-2xl overflow-hidden">

      <!-- Column header -->
      <div class="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-[#252540] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
        <span>Paket</span>
        <span class="text-center">Sisa</span>
        <span class="text-right">Berlaku</span>
      </div>

      <!-- Scrollable rows -->
      <div class="overflow-y-auto max-h-[480px] divide-y divide-[#1E1E30]">
        <div
          v-for="cr in credits"
          :key="cr.id"
          class="px-4 py-3 hover:bg-[#181828] transition-colors"
          :class="isExpiringSoon(cr.expires_at) ? 'border-l-2 border-orange-500' : ''"
        >
          <div class="grid grid-cols-[1fr_auto_auto] gap-3 items-center">

            <!-- Left: name + store + progress bar -->
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-white text-sm font-semibold truncate">{{ cr.package?.name }}</span>
                <span v-if="isExpiringSoon(cr.expires_at)" class="text-orange-400 text-[10px] font-bold">
                  ⚠️ {{ daysUntilExpiry(cr.expires_at) }}h lagi
                </span>
              </div>
              <div class="text-[#6B7280] text-[11px] truncate">{{ cr.store?.name }}</div>
              <!-- Mini progress bar -->
              <div class="mt-1.5 h-1 bg-[#252540] rounded-full overflow-hidden w-full max-w-[160px]">
                <div
                  class="h-full bg-[#7C3AED] rounded-full"
                  :style="{ width: `${cr.used_percent}%` }"
                />
              </div>
              <div class="text-[#6B7280] text-[10px] mt-0.5">{{ cr.used_hours }}/{{ cr.total_hours }} jam terpakai</div>
            </div>

            <!-- Center: remaining hours badge -->
            <div class="flex-shrink-0 text-center">
              <div class="text-[#A78BFA] font-black text-base leading-none">{{ cr.remaining_hours }}</div>
              <div class="text-[#6B7280] text-[10px]">jam</div>
            </div>

            <!-- Right: expiry date -->
            <div class="flex-shrink-0 text-right">
              <span
                class="text-xs font-medium"
                :class="isExpiringSoon(cr.expires_at) ? 'text-orange-400' : 'text-[#9CA3AF]'"
              >
                {{ cr.expires_at ? formatDate(cr.expires_at) : '∞' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer hint -->
      <div v-if="credits.length > 5" class="px-4 py-2 border-t border-[#252540] text-center text-[11px] text-[#6B7280]">
        Scroll untuk lihat semua credits
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink }     from 'vue-router'
import { getMyCredits }   from '@/api/authApi'

const credits = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await getMyCredits()
    credits.value = data.data || []
  } catch {
    credits.value = []
  } finally {
    loading.value = false
  }
})

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const isExpiringSoon  = (d) => d && Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24)) <= 7
const daysUntilExpiry = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
</script>
