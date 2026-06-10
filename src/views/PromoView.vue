<template>
  <div class="max-w-2xl mx-auto px-4 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-2xl font-bold text-white">Promo Saya</h1>
        <p class="text-[#9CA3AF] text-sm mt-0.5">Voucher yang tersedia untuk kamu</p>
      </div>
      <div v-if="vouchers.length" class="bg-[#0282DE]/20 text-[#19B9EE] text-xs font-bold px-3 py-1.5 rounded-full">
        {{ vouchers.length }} Voucher
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 bg-[#11111E] rounded-xl animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!vouchers.length" class="text-center py-16">
      <div class="text-5xl mb-4">🏷️</div>
      <div class="text-white font-bold mb-2">Belum ada promo</div>
      <p class="text-[#9CA3AF] text-sm">Promo dan voucher akan muncul di sini ketika tersedia untukmu.</p>
    </div>

    <!-- Voucher list — scrollable container -->
    <div
      v-else
      class="bg-[#11111E] border border-[#252540] rounded-2xl overflow-hidden"
    >
      <!-- Column header -->
      <div class="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-[#252540] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
        <span>Voucher</span>
        <span class="text-center">Diskon</span>
        <span class="text-right">Berlaku</span>
      </div>

      <!-- Scrollable rows -->
      <div class="overflow-y-auto max-h-[420px] divide-y divide-[#1E1E30]">
        <div
          v-for="v in vouchers"
          :key="v.voucher_id"
          class="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-[#181828] transition-colors"
        >
          <!-- Left: name + code + min purchase -->
          <div class="min-w-0">
            <div class="text-white font-semibold text-sm truncate">{{ v.name }}</div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[#0282DE] text-xs font-bold tracking-wider">{{ v.code }}</span>
              <span v-if="v.min_purchase > 0" class="text-[#6B7280] text-[10px]">
                · min {{ formatRp(v.min_purchase) }}
              </span>
            </div>
          </div>

          <!-- Center: discount badge -->
          <div class="flex-shrink-0">
            <span class="bg-[#0282DE]/20 text-[#19B9EE] text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap">
              <template v-if="v.discount_type === 'percentage'">{{ v.discount_value }}% OFF</template>
              <template v-else>Rp {{ formatRpNum(v.discount_value) }}</template>
            </span>
          </div>

          <!-- Right: expiry -->
          <div class="flex-shrink-0 text-right">
            <span
              class="text-xs font-medium"
              :class="isExpiringSoon(v.valid_until)
                ? 'text-orange-400'
                : v.valid_until ? 'text-[#9CA3AF]' : 'text-[#6B7280]'"
            >
              {{ v.valid_until ? formatDate(v.valid_until) : '∞' }}
            </span>
            <div v-if="isExpiringSoon(v.valid_until)" class="text-orange-400 text-[10px]">
              ⚠️ {{ daysLeft(v.valid_until) }}h lagi
            </div>
          </div>
        </div>
      </div>

      <!-- Footer hint -->
      <div v-if="vouchers.length > 5" class="px-4 py-2 border-t border-[#252540] text-center text-[11px] text-[#6B7280]">
        Scroll untuk lihat semua voucher
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyVouchers }  from '@/api/authApi'

const vouchers = ref([])
const loading  = ref(true)

onMounted(async () => {
  try {
    const { data } = await getMyVouchers()
    vouchers.value = data.data || []
  } catch {
    vouchers.value = []
  } finally {
    loading.value = false
  }
})

const formatDate     = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const formatRp       = (p) => 'Rp ' + Math.round(p || 0).toLocaleString('id-ID')
const formatRpNum    = (p) => Math.round(p || 0).toLocaleString('id-ID')
const isExpiringSoon = (d) => d && Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24)) <= 7
const daysLeft       = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
</script>
