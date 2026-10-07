<template>
  <div class="space-y-4">
    <!-- Play Credits -->
    <div v-if="loggedIn">
      <p class="mb-2 text-xs font-medium text-q-text-2">Play Credits</p>
      <p v-if="loadingCredits" class="text-xs text-q-text-3">Memuat credits…</p>
      <div v-else-if="validCredits.length" role="group" aria-label="Play Credits" class="space-y-2">
        <button
          v-for="cr in validCredits"
          :key="cr.id"
          type="button"
          data-credit
          :aria-pressed="cr.id === selectedCreditId"
          :class="optionClass(cr.id === selectedCreditId)"
          @click="emit('select-credit', cr)"
        >
          <span class="size-9 shrink-0 rounded-lg bg-q-primary/15 text-q-primary-l flex items-center justify-center">
            <Gamepad2 class="size-5" aria-hidden="true" />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-q-text">{{ cr.package?.name }}</span>
            <span class="block text-xs text-q-text-3">Sisa {{ cr.remaining_hours }} jam · berlaku s/d {{ formatDateShort(cr.expires_at) }}</span>
          </span>
        </button>
      </div>
      <p v-else-if="hasExpiredCredits" role="note" class="flex gap-2 rounded-xl bg-q-red/10 p-3 text-xs text-q-red">
        <TriangleAlert class="size-4 shrink-0" aria-hidden="true" />
        <span>Play Credits kamu tidak berlaku untuk {{ formatDateShort(bookingDate) }} atau durasi ini. Pakai metode lain atau beli paket baru.</span>
      </p>
      <p v-else class="text-xs text-q-text-3">
        Belum ada Play Credits aktif.
        <RouterLink to="/credits" class="text-q-primary-l underline underline-offset-2">Beli credits</RouterLink>
      </p>
    </div>

    <!-- Voucher -->
    <div v-if="vouchers.length && !selectedCreditId">
      <button
        v-if="!selectedVoucher"
        type="button"
        data-voucher-open
        :class="optionClass(false)"
        @click="emit('open-vouchers')"
      >
        <span class="size-9 shrink-0 rounded-lg bg-q-gold/15 text-q-gold flex items-center justify-center">
          <TicketPercent class="size-5" aria-hidden="true" />
        </span>
        <span class="flex-1 text-sm text-q-text-2">Punya voucher?</span>
        <span class="text-xs font-semibold text-q-primary-l">{{ vouchers.length }} tersedia</span>
        <ChevronRight class="size-4 text-q-primary-l" aria-hidden="true" />
      </button>
      <div v-else class="flex items-center gap-3 rounded-xl border border-q-gold/40 bg-q-gold/10 p-3">
        <span class="size-9 shrink-0 rounded-lg bg-q-gold/15 text-q-gold flex items-center justify-center">
          <TicketPercent class="size-5" aria-hidden="true" />
        </span>
        <span class="flex-1 min-w-0">
          <span class="block truncate text-sm font-semibold text-q-text">{{ selectedVoucher.name }}</span>
          <span class="block text-xs text-q-gold">{{ voucherLabel(selectedVoucher) }} · {{ selectedVoucher.code }}</span>
        </span>
        <button
          type="button"
          :aria-label="`Hapus voucher ${selectedVoucher.code}`"
          class="size-11 shrink-0 flex items-center justify-center rounded-full text-q-text-2 hover:text-q-red hover:bg-white/5 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
          @click="emit('clear-voucher')"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Metode bayar (disembunyikan jika pakai credits) -->
    <div v-if="!selectedCreditId">
      <p class="mb-2 text-xs font-medium text-q-text-2">Metode pembayaran</p>
      <PaymentMethodPicker :model-value="paymentMethod" @update:model-value="emit('update:paymentMethod', $event)" />
    </div>

    <p class="flex items-center gap-1.5 text-xs text-q-text-3">
      <ShieldCheck class="size-3.5" aria-hidden="true" /> Pembayaran diproses di halaman aman payment gateway.
    </p>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Gamepad2, TriangleAlert, TicketPercent, ChevronRight, X, ShieldCheck } from 'lucide-vue-next'
import PaymentMethodPicker from '@/components/booking/PaymentMethodPicker.vue'
import { formatRp, formatDateShort } from '@/utils/format'

defineProps({
  loggedIn:          Boolean,
  loadingCredits:    Boolean,
  validCredits:      { type: Array, default: () => [] },
  selectedCreditId:  { type: [String, Number], default: '' },
  hasExpiredCredits: Boolean,
  bookingDate:       { type: String, default: '' },
  vouchers:          { type: Array, default: () => [] },
  selectedVoucher:   { type: Object, default: null },
  paymentMethod:     { type: String, default: '' },
})
const emit = defineEmits(['select-credit', 'open-vouchers', 'clear-voucher', 'update:paymentMethod'])

const optionClass = (active) => [
  'flex w-full items-center gap-3 rounded-xl border p-3 text-left cursor-pointer transition-colors',
  'focus-visible:outline-2 focus-visible:outline-focus-ring',
  active ? 'border-q-primary bg-q-primary/10' : 'border-border-subtle hover:border-q-primary/60',
]

const voucherLabel = (v) => (v.discount_type === 'percentage' ? `${v.discount_value}% off` : `Hemat ${formatRp(v.discount_value)}`)
</script>
