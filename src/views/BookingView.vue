<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-44 lg:pb-10">
    <PageHeader title="Booking Ruangan" subtitle="Pilih cabang, ruangan, dan jam bermainmu" />

    <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
      <!-- ── Langkah (hanya satu terbuka) ─────────────────────── -->
      <div class="space-y-3">
        <BookingStep
          v-for="(step, i) in steps"
          :key="step.title"
          data-step
          :data-open="openStep === i"
          :index="i + 1"
          :title="step.title"
          :summary="step.summary"
          :open="openStep === i"
          :done="isDone(i)"
          @edit="editingStep = i"
        >
          <BranchStep v-if="i === 0" :stores="stores" :model-value="form.storeId" @select="chooseStore" />

          <RoomStep v-else-if="i === 1" :rooms="roomTemplates" :model-value="form.roomTemplateId" :loading="loadingRooms" @select="chooseRoom" />

          <DateStep v-else-if="i === 2" :model-value="form.date" :min="today" @update:model-value="chooseDate" />

          <template v-else-if="i === 3">
            <SlotGrid
              :slots="hourlySlots"
              :selected="selectedSlots"
              :hours="storeHours"
              :loading="loadingSlots"
              @toggle="toggleSlot"
              @clear="clearAllSlots"
            />
            <BaseButton v-if="selectedSlots.length" class="mt-3" block @click="confirmSlots">
              Lanjut ke pembayaran
            </BaseButton>
          </template>

          <PaymentStep
            v-else
            v-model:payment-method="form.paymentMethod"
            :logged-in="authStore.isLoggedIn"
            :loading-credits="loadingCredits"
            :valid-credits="validCredits"
            :selected-credit-id="selectedCreditId"
            :has-expired-credits="hasExpiredCreditsForDate"
            :booking-date="form.date"
            :vouchers="availableVouchers"
            :selected-voucher="selectedVoucher"
            @select-credit="selectCredit"
            @open-vouchers="showVoucherSheet = true"
            @clear-voucher="onSelectVoucher(null)"
          />
        </BookingStep>
      </div>

      <!-- ── Ringkasan: sticky di kanan (desktop), di bawah langkah (mobile) ── -->
      <aside
        v-if="selectedSlots.length"
        aria-label="Ringkasan booking"
        class="mt-4 lg:mt-0 lg:sticky lg:top-20 rounded-2xl border border-border-subtle bg-surface p-4"
      >
        <h2 class="font-display text-base font-semibold text-q-text mb-3">Ringkasan</h2>
        <dl class="space-y-1.5 text-sm mb-3">
          <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
            <dt class="text-q-text-3">{{ row.label }}</dt>
            <dd class="text-q-text text-right">{{ row.value }}</dd>
          </div>
        </dl>
        <BookingPriceSummary
          class="border-t border-border-subtle pt-3"
          :quote="quote"
          :loading="quoteLoading"
          :error="quoteError"
          :voucher-discount="discountAmount"
          :voucher-code="selectedVoucher?.code || ''"
          @retry="refreshQuote"
        />
        <BaseButton class="mt-4 hidden lg:flex" size="lg" block :disabled="!canPay" :loading="initiating" @click="handleBooking">
          {{ initiating ? 'Memproses...' : 'Bayar Sekarang' }}
        </BaseButton>
      </aside>
    </div>

    <!-- ── Bar bayar sticky (mobile), di atas BottomNav ── -->
    <div
      v-if="selectedSlots.length"
      data-pay-bar
      class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 z-40 border-t border-border-subtle bg-q-bg/95 backdrop-blur-xl lg:hidden"
    >
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs text-q-text-3">{{ discountAmount > 0 ? 'Estimasi total' : 'Total' }}</p>
          <p class="font-display text-lg font-semibold text-q-text tabular-nums">
            {{ quoteLoading ? '…' : quote ? formatRp(Math.max(0, quote.total_price - discountAmount)) : '—' }}
          </p>
        </div>
        <BaseButton v-if="pickingSlots" size="lg" @click="confirmSlots">Lanjut</BaseButton>
        <BaseButton v-else size="lg" :disabled="!canPay" :loading="initiating" @click="handleBooking">
          {{ initiating ? 'Memproses...' : 'Bayar Sekarang' }}
        </BaseButton>
      </div>
    </div>

    <VoucherSheet
      v-model="showVoucherSheet"
      :vouchers="availableVouchers"
      :selected="selectedVoucher"
      @select="onSelectVoucher"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useBookingForm } from '@/composables/useBookingForm'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookingStep from '@/components/booking/BookingStep.vue'
import BranchStep from '@/components/booking/BranchStep.vue'
import RoomStep from '@/components/booking/RoomStep.vue'
import DateStep from '@/components/booking/DateStep.vue'
import SlotGrid from '@/components/booking/SlotGrid.vue'
import PaymentStep from '@/components/booking/PaymentStep.vue'
import VoucherSheet from '@/components/booking/VoucherSheet.vue'
import BookingPriceSummary from '@/components/booking/BookingPriceSummary.vue'
import { addHour } from '@/utils/dates'
import { formatRp, formatDateLong } from '@/utils/format'

// Semua state + API ada di useBookingForm; view ini hanya menyusun langkah.
const authStore = useAuthStore()
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

// ── Accordion: langkah aktif = langkah berikutnya yang belum diisi,
//    kecuali user menekan "Ubah" pada langkah sebelumnya.
// Langkah Jam baru selesai setelah "Lanjut" — supaya user bisa memilih beberapa jam.
const SLOT_STEP      = 3
const editingStep    = ref(null)
const slotsConfirmed = ref(false)

watch(() => selectedSlots.value.length, (n) => { if (n === 0) slotsConfirmed.value = false })

const openStep = computed(() => {
  if (editingStep.value !== null) return editingStep.value
  if (currentStep.value > SLOT_STEP && !slotsConfirmed.value) return SLOT_STEP
  return currentStep.value
})
const isDone       = (i) => (i === SLOT_STEP ? currentStep.value > i && slotsConfirmed.value : i < SLOT_STEP && currentStep.value > i)
const pickingSlots = computed(() => openStep.value === SLOT_STEP)

const confirmSlots = () => {
  slotsConfirmed.value = true
  editingStep.value    = null
}

const timeRange = computed(() => selectedSlots.value.length
  ? `${selectedSlots.value[0]}–${addHour(selectedSlots.value.at(-1))} (${selectedSlots.value.length} jam)`
  : '')

const steps = computed(() => [
  { title: 'Pilih Cabang',  summary: selectedStore.value?.name ?? '' },
  { title: 'Pilih Ruangan', summary: selectedRoom.value?.name ?? '' },
  { title: 'Pilih Tanggal', summary: formatDateLong(form.date) },
  { title: 'Pilih Jam',     summary: timeRange.value },
  { title: 'Pembayaran',    summary: '' },
])

const summaryRows = computed(() => [
  { label: 'Cabang',  value: selectedStore.value?.name ?? '—' },
  { label: 'Ruangan', value: selectedRoom.value?.name ?? '—' },
  { label: 'Tanggal', value: formatDateLong(form.date) },
  { label: 'Jam',     value: timeRange.value },
])

// Memilih nilai menutup mode "Ubah" → accordion lanjut ke langkah berikutnya.
// Pilihan yang sama tidak me-reset langkah setelahnya.
const chooseStore = async (id) => {
  editingStep.value = null
  if (id === form.storeId) return
  form.storeId = id
  await onStoreChange()
}
const chooseRoom = (room) => {
  editingStep.value = null
  if (room.id !== form.roomTemplateId) onRoomSelect(room)
}
const chooseDate = (date) => {
  editingStep.value = null
  if (date === form.date) return
  form.date = date
  onDateChange()
}

onMounted(init)
</script>
