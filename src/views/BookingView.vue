<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:pb-10">
    <!-- ── HP: layar checkout (?step=pay) ─────────────────────── -->
    <template v-if="phoneCheckout">
      <h1 class="sr-only">Booking Ruangan</h1>
      <CheckoutShell mode="screen" title="Pembayaran" @close="closeCheckout">
        <HudPanel class="mb-4 p-4">
          <dl class="mb-3 space-y-1.5 text-sm">
            <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
              <dt class="text-q-text-3">{{ row.label }}</dt>
              <dd class="text-right text-q-text">{{ row.value }}</dd>
            </div>
          </dl>
          <BookingPriceSummary v-bind="priceProps" class="border-t border-border-subtle pt-3" @retry="refreshQuote" />
        </HudPanel>
        <PaymentStep v-bind="paymentProps" v-on="paymentEvents" />
      </CheckoutShell>
    </template>

    <!-- ── Loadout: semua langkah terlihat, terkunci berurutan ── -->
    <template v-else>
      <PageHeader title="Booking Ruangan" subtitle="Cabang, ruangan, tanggal, lalu jam">
        <template #actions>
          <FlowProgress :current="Math.min(currentStep, STEP_COUNT)" :count="STEP_COUNT" class="mt-1.5" />
        </template>
      </PageHeader>

      <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div class="space-y-5">
          <div class="space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-6 lg:space-y-0">
            <FlowStep
              v-for="i in [0, 1]"
              :key="i"
              data-step
              v-bind="stepProps(i)"
              @edit="flow.edit(i)"
              @cancel="flow.cancelEdit()"
            >
              <BranchStep v-if="i === 0" :stores="stores" :model-value="form.storeId" @select="chooseStore" />
              <RoomStep v-else :rooms="roomTemplates" :model-value="form.roomTemplateId" :loading="loadingRooms" @select="chooseRoom" />
            </FlowStep>
          </div>

          <FlowStep v-for="i in [2, 3]" :key="i" data-step v-bind="stepProps(i)" @edit="flow.edit(i)" @cancel="flow.cancelEdit()">
            <DateStep v-if="i === 2" :model-value="form.date" :min="today" @update:model-value="chooseDate" />
            <SlotGrid
              v-else
              :slots="hourlySlots"
              :selected="selectedSlots"
              :hours="storeHours"
              :loading="loadingSlots"
              @toggle="toggleSlot"
              @clear="clearAllSlots"
            />
          </FlowStep>
        </div>

        <!-- Desktop: ringkasan + pembayaran menempel di kanan -->
        <CheckoutShell v-if="isDesktop" mode="panel" title="Ringkasan">
          <dl class="space-y-1.5 text-sm">
            <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
              <dt class="text-q-text-3">{{ row.label }}</dt>
              <dd class="text-right" :class="row.value === '—' ? 'text-q-text-3' : 'text-q-text'">{{ row.value }}</dd>
            </div>
          </dl>
          <template v-if="flow.ready.value">
            <BookingPriceSummary v-bind="priceProps" class="mt-3 border-t border-border-subtle pt-3" @retry="refreshQuote" />
            <PaymentStep v-bind="paymentProps" class="mt-4 border-t border-border-subtle pt-4" v-on="paymentEvents" />
          </template>
          <template #footer>
            <BaseButton size="lg" block :disabled="!flow.ready.value || !canPay" :loading="initiating" @click="handleBooking">
              {{ initiating ? 'Memproses...' : 'Bayar Sekarang' }}
            </BaseButton>
            <p v-if="!flow.ready.value" class="mt-2 text-center text-xs text-q-text-3">Lengkapi {{ flow.remaining.value }} langkah lagi</p>
          </template>
        </CheckoutShell>
      </div>
    </template>

    <!-- ── HP: bar harga + aksi, di atas BottomNav ── -->
    <PayBar
      v-if="!isDesktop"
      v-bind="payBarProps"
      @action="phoneCheckout ? handleBooking() : openCheckout()"
      @retry="refreshQuote"
    />

    <VoucherSheet
      v-model="showVoucherSheet"
      :vouchers="availableVouchers"
      :selected="selectedVoucher"
      @select="onSelectVoucher"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { useBookingForm } from '@/composables/useBookingForm'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useCheckoutStep } from '@/composables/useCheckoutStep'
import { useFlowSteps } from '@/components/flow/useFlowSteps'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import FlowStep from '@/components/flow/FlowStep.vue'
import FlowProgress from '@/components/flow/FlowProgress.vue'
import PayBar from '@/components/flow/PayBar.vue'
import CheckoutShell from '@/components/flow/CheckoutShell.vue'
import BranchStep from '@/components/booking/BranchStep.vue'
import RoomStep from '@/components/booking/RoomStep.vue'
import DateStep from '@/components/booking/DateStep.vue'
import SlotGrid from '@/components/booking/SlotGrid.vue'
import PaymentStep from '@/components/booking/PaymentStep.vue'
import VoucherSheet from '@/components/booking/VoucherSheet.vue'
import BookingPriceSummary from '@/components/booking/BookingPriceSummary.vue'
import { addHour } from '@/utils/dates'
import { formatRp, formatRpShort, formatDateLong } from '@/utils/format'

// Semua state + API ada di useBookingForm; view ini hanya menyusun langkah.
const authStore = useAuthStore()
const toast     = useToast()
const {
  stores, roomTemplates, hourlySlots, selectedSlots, form, today,
  loadingRooms, loadingSlots, initiating, availableVouchers, selectedVoucher,
  validCredits, selectedCreditId, loadingCredits,
  selectedStore, selectedRoom, storeHours, currentStep,
  quote, quoteLoading, quoteError, refreshQuote, discountAmount, hasExpiredCreditsForDate, canPay,
  onStoreChange, onRoomSelect, onDateChange, toggleSlot, clearAllSlots,
  selectCredit, onSelectVoucher, handleBooking, init,
} = useBookingForm()

const showVoucherSheet = ref(false)
const isDesktop        = useMediaQuery('(min-width: 1024px)')

// ── Langkah berurutan (aturan bisnis: cabang → ruangan → tanggal → jam) ──
const STEP_COUNT = 4
const flow = useFlowSteps(STEP_COUNT, currentStep)

const { inCheckout, open: openCheckout, close: closeCheckout } = useCheckoutStep(flow.ready)
const phoneCheckout = computed(() => inCheckout.value && !isDesktop.value)

const timeRange = computed(() => selectedSlots.value.length
  ? `${selectedSlots.value[0]}–${addHour(selectedSlots.value.at(-1))} (${selectedSlots.value.length} jam)`
  : '')

const STEPS = [
  { title: 'Pilih Cabang',  hint: '' },
  { title: 'Pilih Ruangan', hint: 'Pilih cabang dulu' },
  { title: 'Pilih Tanggal', hint: 'Pilih ruangan dulu' },
  { title: 'Pilih Jam',     hint: 'Pilih tanggal dulu' },
]
const summaries = computed(() => [
  selectedStore.value?.name ?? '',
  selectedRoom.value?.name ?? '',
  formatDateLong(form.date),
  timeRange.value,
])
const stepProps = (i) => ({
  index:      i + 1,
  title:      STEPS[i].title,
  lockedHint: STEPS[i].hint,
  state:      flow.stateOf(i),
  summary:    summaries.value[i],
  cancelable: flow.editing.value === i,
  expandDone: isDesktop.value,
  last:       i === STEP_COUNT - 1 || (isDesktop.value && i < 2),
})

const summaryRows = computed(() => [
  { label: 'Cabang',  value: selectedStore.value?.name || '—' },
  { label: 'Ruangan', value: selectedRoom.value?.name || '—' },
  { label: 'Tanggal', value: formatDateLong(form.date) || '—' },
  { label: 'Jam',     value: timeRange.value || '—' },
])

// ── Harga & pembayaran ───────────────────────────────────────────
const totalLabel = computed(() => {
  if (quoteLoading.value) return '…'
  return quote.value ? formatRp(Math.max(0, quote.value.total_price - discountAmount.value)) : '—'
})

const payBarProps = computed(() => {
  const hasSlots = selectedSlots.value.length > 0
  if (phoneCheckout.value) {
    return {
      label:       discountAmount.value > 0 ? 'Estimasi total' : 'Total',
      amount:      totalLabel.value,
      error:       !!quoteError.value,
      actionLabel: initiating.value ? 'Memproses...' : 'Bayar Sekarang',
      disabled:    !canPay.value,
      loading:     initiating.value,
    }
  }
  return {
    label:       hasSlots ? timeRange.value : selectedRoom.value ? 'Mulai' : 'Total',
    amount:      hasSlots ? totalLabel.value : selectedRoom.value ? `${formatRpShort(selectedRoom.value.min_price)}/jam` : '—',
    error:       hasSlots && !!quoteError.value,
    actionLabel: 'Lanjut',
    disabled:    !flow.ready.value,
    hint:        `Lengkapi ${flow.remaining.value} langkah lagi`,
  }
})

const priceProps = computed(() => ({
  quote:          quote.value,
  loading:        quoteLoading.value,
  error:          quoteError.value,
  voucherDiscount: discountAmount.value,
  voucherCode:    selectedVoucher.value?.code || '',
}))

const paymentProps = computed(() => ({
  paymentMethod:     form.paymentMethod,
  loggedIn:          authStore.isLoggedIn,
  loadingCredits:    loadingCredits.value,
  validCredits:      validCredits.value,
  selectedCreditId:  selectedCreditId.value,
  hasExpiredCredits: hasExpiredCreditsForDate.value,
  bookingDate:       form.date,
  vouchers:          availableVouchers.value,
  selectedVoucher:   selectedVoucher.value,
}))
const paymentEvents = {
  'update:paymentMethod': (v) => { form.paymentMethod = v },
  'select-credit':        selectCredit,
  'open-vouchers':        () => { showVoucherSheet.value = true },
  'clear-voucher':        () => onSelectVoucher(null),
}

// Memilih nilai menutup mode "Ubah". Pilihan yang sama tidak me-reset langkah setelahnya;
// pilihan berbeda me-reset (logika di useBookingForm) dan user diberi tahu.
const chooseStore = async (id) => {
  flow.cancelEdit()
  if (id === form.storeId) return
  const hadRoom = !!form.roomTemplateId
  form.storeId = id
  await onStoreChange()
  if (hadRoom) toast.info('Ruangan & jam di-reset')
}
const chooseRoom = (room) => {
  flow.cancelEdit()
  if (room.id === form.roomTemplateId) return
  const hadDate = !!form.date
  onRoomSelect(room)
  if (hadDate) toast.info('Tanggal & jam di-reset')
}
const chooseDate = (date) => {
  flow.cancelEdit()
  if (date === form.date) return
  const hadSlots = selectedSlots.value.length > 0
  form.date = date
  onDateChange()
  if (hadSlots) toast.info('Jam di-reset')
}

onMounted(init)
</script>
