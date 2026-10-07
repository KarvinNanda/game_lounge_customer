<template>
  <div class="space-y-2 text-sm">
    <!-- Loading -->
    <div v-if="loading" data-quote-loading class="space-y-2" aria-busy="true">
      <BaseSkeleton class="h-4 w-full !rounded-md" />
      <BaseSkeleton class="h-4 w-2/3 !rounded-md" />
      <BaseSkeleton class="h-6 w-1/2 ml-auto !rounded-md" />
    </div>

    <!-- Error dari server (mis. di luar jam operasional, tanggal lewat) -->
    <div v-else-if="error" role="alert" class="flex items-center justify-between gap-3 text-q-red text-xs bg-q-red/10 rounded-lg px-3 py-2">
      <span>{{ error }}</span>
      <button
        type="button"
        class="shrink-0 min-h-11 px-2 font-semibold text-q-text hover:underline cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-focus-ring"
        @click="emit('retry')"
      >Coba lagi</button>
    </div>

    <template v-else-if="quote">
      <p v-if="quote.available === false" role="alert" class="text-q-red text-xs bg-q-red/10 rounded-lg px-3 py-2">
        Slot sudah tidak tersedia, pilih jam lain.
      </p>

      <ul class="space-y-1.5">
        <li
          v-for="(item, i) in quote.breakdown || []"
          :key="i"
          data-breakdown-row
          class="flex justify-between gap-3"
        >
          <span class="text-q-text-2 min-w-0">
            {{ item.time_range }}
            <span v-if="item.description" class="text-q-text-3">· {{ item.description }}</span>
            <span
              v-if="item.type && item.type !== 'Normal Hour'"
              class="ml-1 inline-block rounded-full px-1.5 text-[11px] font-semibold"
              :class="item.type === 'Flash Sale' ? 'bg-q-red/15 text-q-red' : 'bg-q-gold/15 text-q-gold'"
            >{{ item.type }}</span>
          </span>
          <span class="text-q-text shrink-0">{{ formatRp(item.amount) }}</span>
        </li>
      </ul>

      <div v-if="quote.has_flash_sale && quote.flash_discount > 0" class="flex justify-between text-q-red">
        <span>{{ quote.flash_sale_name || 'Flash Sale' }}</span>
        <span>- {{ formatRp(quote.flash_discount) }}</span>
      </div>

      <div v-if="voucherDiscount > 0" class="flex justify-between text-q-green">
        <span>Diskon voucher{{ voucherCode ? ` (${voucherCode})` : '' }} · estimasi</span>
        <span>- {{ formatRp(voucherDiscount) }}</span>
      </div>

      <div class="border-t border-q-border pt-2.5 flex justify-between items-end gap-3">
        <span class="text-q-text-2">
          {{ voucherDiscount > 0 ? 'Estimasi setelah voucher' : 'Total Pembayaran' }}
        </span>
        <span data-total class="text-right">
          <s v-if="quote.has_flash_sale && quote.flash_discount > 0" class="block text-q-text-3 text-xs">
            {{ formatRp(quote.base_price) }}
          </s>
          <span class="text-q-primary-l font-bold text-lg">{{ formatRp(total) }}</span>
        </span>
      </div>
      <!-- Backend: angka final setelah voucher hanya dari /bookings/initiate -->
      <p v-if="voucherDiscount > 0" class="text-q-text-3 text-xs">
        Potongan voucher final dihitung saat checkout.
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const emit = defineEmits(['retry'])

const props = defineProps({
  quote:           { type: Object, default: null },  // data dari GET /public/booking/quote
  loading:         Boolean,
  error:           { type: String, default: '' },
  voucherDiscount: { type: Number, default: 0 },
  voucherCode:     { type: String, default: '' },
})

const total = computed(() => Math.max(0, (props.quote?.total_price || 0) - props.voucherDiscount))

const formatRp = (n) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`
</script>
