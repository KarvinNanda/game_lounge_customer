<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6">
    <PageHeader title="Promo & Voucher" subtitle="Voucher yang bisa kamu pakai saat booking">
      <template v-if="vouchers.length" #actions>
        <BaseButton to="/booking" size="sm">Pakai saat booking</BaseButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="grid gap-2 lg:grid-cols-3" aria-busy="true">
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

    <ul v-else class="grid gap-2 lg:grid-cols-3">
      <li v-for="v in vouchers" :key="v.voucher_id">
        <!-- Tiket: potongan setengah lingkaran di tengah sisi kiri/kanan -->
        <div class="ticket relative flex h-full items-stretch bg-surface shadow-[inset_0_0_0_1px_var(--color-q-border)]" :class="{ 'opacity-60': expiry(v).state === 'expired' }">
          <div class="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed border-q-border bg-q-gold/10 p-3 text-center text-q-gold">
            <TicketPercent class="size-5" aria-hidden="true" />
            <span class="font-display text-[15px] leading-tight">{{ discountLabel(v) }}</span>
          </div>
          <div class="min-w-0 flex-1 p-3">
            <p class="truncate text-sm font-semibold text-q-text">{{ v.name }}</p>
            <p class="text-xs text-q-text-3">
              <template v-if="v.min_purchase > 0">min {{ formatRp(v.min_purchase) }} · </template>
              <span :class="EXPIRY_TONE[expiry(v).state]">{{ expiry(v).state === 'ok' ? `s/d ${formatDateShort(v.end_date?.slice(0, 10))}` : expiry(v).label }}</span>
            </p>
            <div class="mt-2 flex items-center gap-1">
              <code class="hud-cut-sm bg-q-bg/70 px-2 py-1 font-mono text-xs tracking-[0.12em] text-q-primary-l">{{ v.code }}</code>
              <button
                type="button"
                :aria-label="`Salin kode ${v.code}`"
                class="-my-2 flex size-11 cursor-pointer items-center justify-center text-q-text-2 transition-colors hover:text-q-primary-l hud-focus"
                @click="copy(v.code)"
              >
                <Copy class="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </li>
    </ul>
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

<style scoped>
/* Potongan tiket di kiri & kanan (mask: tidak memotong focus ring di dalam) */
.ticket {
  --notch: 9px;
  mask: radial-gradient(circle var(--notch) at 0 50%, transparent 98%, black) left / 51% 100% no-repeat,
        radial-gradient(circle var(--notch) at 100% 50%, transparent 98%, black) right / 51% 100% no-repeat;
}
</style>
