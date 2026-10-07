<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6">
    <PageHeader title="Promo & Voucher" subtitle="Voucher yang bisa kamu pakai saat booking" />

    <div v-if="loading" class="space-y-2" aria-busy="true">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-24" />
    </div>

    <!-- Backend mengembalikan [] untuk non-member: jelaskan, jangan cuma "kosong" -->
    <BaseEmptyState
      v-else-if="!vouchers.length && !authStore.isMember"
      :icon="Crown"
      title="Voucher khusus member"
      text="Voucher promo hanya tersedia untuk member Quantum. Tanyakan ke kasir cara menjadi member."
    />

    <BaseEmptyState v-else-if="!vouchers.length" :icon="TicketPercent" title="Belum ada voucher" text="Voucher baru akan muncul di sini." />

    <ul v-else class="space-y-2">
      <li v-for="v in vouchers" :key="v.voucher_id">
        <BaseCard class="flex items-stretch overflow-hidden" :class="{ 'opacity-60': expiry(v).state === 'expired' }">
          <div class="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed border-border-subtle bg-q-gold/10 p-3 text-center text-q-gold">
            <TicketPercent class="size-6" aria-hidden="true" />
            <span class="text-xs font-bold leading-tight">{{ discountLabel(v) }}</span>
          </div>
          <div class="min-w-0 flex-1 p-3">
            <p class="truncate text-sm font-semibold text-q-text">{{ v.name }}</p>
            <p class="text-xs text-q-text-3">
              <template v-if="v.min_purchase > 0">min {{ formatRp(v.min_purchase) }} · </template>
              <span :class="EXPIRY_TONE[expiry(v).state]">{{ expiry(v).state === 'ok' ? `s/d ${formatDateShort(v.end_date?.slice(0, 10))}` : expiry(v).label }}</span>
            </p>
            <div class="mt-2 flex items-center gap-2">
              <code class="rounded-md bg-white/5 px-2 py-1 font-mono text-xs tracking-wider text-q-text">{{ v.code }}</code>
              <button
                type="button"
                :aria-label="`Salin kode ${v.code}`"
                class="size-11 -my-2 flex items-center justify-center rounded-full text-q-text-2 hover:text-q-text hover:bg-white/5 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                @click="copy(v.code)"
              >
                <Copy class="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </BaseCard>
      </li>
    </ul>

    <BaseButton v-if="vouchers.length" to="/booking" class="mt-4" size="lg" block>Pakai saat booking</BaseButton>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TicketPercent, Crown, Copy } from 'lucide-vue-next'
import { getMyVouchers } from '@/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { dateOnlyExpiryState } from '@/utils/dates'
import { formatRp, formatDateShort } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'

const EXPIRY_TONE = { none: '', ok: '', soon: 'font-semibold text-q-gold', expired: 'font-semibold text-q-red' }

const authStore = useAuthStore()
const toast     = useToast()
const vouchers  = ref([])
const loading   = ref(true)

// end_date = kolom DATE di backend, berlaku sampai akhir hari itu
const expiry        = (v) => dateOnlyExpiryState(v.end_date)
const discountLabel = (v) => (v.discount_type === 'percentage' ? `${v.discount_value}% off` : `Hemat ${formatRp(v.discount_value)}`)

const copy = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    toast.success(`Kode ${code} disalin`)
  } catch {
    toast.error('Gagal menyalin kode')
  }
}

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
</script>
