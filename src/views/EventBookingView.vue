<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-44 lg:pb-10">
    <PageHeader title="Private Event" subtitle="Sewa satu cabang penuh untuk acaramu" />

    <p class="mb-5 flex gap-2 rounded-xl bg-q-primary/10 p-3 text-xs text-q-text-2">
      <Building class="size-4 shrink-0 text-q-primary-l" aria-hidden="true" />
      Semua ruangan di cabang diblokir selama event berlangsung.
    </p>

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
        :done="currentStep > i"
        :cancelable="editingStep === i"
        @edit="editingStep = i"
        @cancel="editingStep = null"
      >
        <BranchStep v-if="i === 0" :stores="stores" :model-value="form.storeId" @select="chooseStore" />

        <!-- Jadwal -->
        <div v-else-if="i === 1" class="space-y-4">
          <DateStep v-model="form.date" :min="today" />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="event-start" class="mb-1.5 block text-xs font-medium text-q-text-2">Jam mulai</label>
              <input id="event-start" v-model="form.startTime" type="time" :class="INPUT" />
            </div>
            <div>
              <label for="event-end" class="mb-1.5 block text-xs font-medium text-q-text-2">Jam selesai</label>
              <input id="event-end" v-model="form.endTime" type="time" :class="INPUT" />
            </div>
          </div>
          <p v-if="sameTime" role="alert" class="text-xs text-q-red">Jam selesai harus berbeda dengan jam mulai.</p>
          <p v-else-if="durationHours > 0" class="text-xs text-q-text-3">
            Durasi {{ durationHours }} jam<template v-if="form.endTime < form.startTime"> (melewati tengah malam)</template>
          </p>

          <p v-if="availability === 'conflict'" role="alert" class="flex gap-2 rounded-xl bg-q-red/10 p-3 text-sm text-q-red">
            <CalendarX class="size-4 shrink-0" aria-hidden="true" /> Jam ini sudah dipakai booking atau event lain. Pilih jam lain.
          </p>
          <p v-else-if="availability === 'error'" role="alert" class="flex items-center justify-between gap-3 rounded-xl bg-q-red/10 p-3 text-sm text-q-red">
            {{ quoteError || 'Gagal mengecek ketersediaan.' }}
            <button v-if="!quoteError" type="button" class="min-h-11 shrink-0 font-semibold text-q-text underline cursor-pointer" @click="checkAvailability">Coba lagi</button>
          </p>

          <BaseButton block :disabled="!scheduleReady || durationHours <= 0" :loading="availability === 'checking'" @click="checkAvailability">
            Cek ketersediaan
          </BaseButton>
        </div>

        <!-- Detail -->
        <div v-else-if="i === 2" class="space-y-3">
          <div>
            <label for="event-name" class="mb-1.5 block text-xs font-medium text-q-text-2">Nama event</label>
            <input id="event-name" v-model="form.eventName" type="text" maxlength="100" placeholder="Contoh: Ulang tahun, turnamen PS5" :class="INPUT" />
          </div>
          <div>
            <label for="event-desc" class="mb-1.5 block text-xs font-medium text-q-text-2">Catatan untuk admin (opsional)</label>
            <textarea id="event-desc" v-model="form.description" rows="2" maxlength="500" placeholder="Contoh: butuh dekorasi" :class="[INPUT, 'resize-none py-2.5']" />
          </div>
          <BaseButton block :disabled="!form.eventName.trim()" @click="detailsConfirmed = true; editingStep = null">Lanjut</BaseButton>
        </div>

        <!-- Pembayaran -->
        <div v-else class="space-y-4">
          <p class="flex items-center gap-2 text-sm font-semibold text-q-green">
            <CircleCheck class="size-4" aria-hidden="true" /> Jadwal tersedia
          </p>
          <dl class="space-y-1.5 rounded-xl bg-surface-raised/50 p-3 text-sm">
            <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
              <dt class="text-q-text-3">{{ row.label }}</dt>
              <dd class="text-right text-q-text">{{ row.value }}</dd>
            </div>
            <div class="flex justify-between gap-4 border-t border-border-subtle pt-2">
              <dt class="text-q-text-2">Total</dt>
              <dd class="font-display text-lg font-semibold text-q-primary-l tabular-nums">{{ totalPrice === null ? '—' : formatRp(totalPrice) }}</dd>
            </div>
          </dl>

          <div>
            <p class="mb-2 text-xs font-medium text-q-text-2">Metode pembayaran</p>
            <PaymentMethodPicker v-model="form.paymentMethod" />
          </div>

          <p v-if="bookingError" role="alert" class="rounded-xl bg-q-red/10 p-3 text-center text-sm text-q-red">{{ bookingError }}</p>

          <!-- Wrapper: `hidden` di BaseButton kalah oleh inline-flex miliknya -->
          <div class="hidden lg:block">
            <BaseButton size="lg" block :disabled="!canPay" :loading="initiating" @click="handleBookEvent">
              {{ initiating ? 'Memproses...' : 'Bayar Sekarang' }}
            </BaseButton>
          </div>
        </div>
      </BookingStep>
    </div>

    <!-- Bar bayar sticky (mobile), di atas BottomNav -->
    <div
      v-if="currentStep === 3"
      data-pay-bar
      class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 md:pb-[env(safe-area-inset-bottom)] z-40 border-t border-border-subtle bg-q-bg/95 backdrop-blur-xl lg:hidden"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs text-q-text-3">Total</p>
          <p class="font-display text-lg font-semibold text-q-text tabular-nums">{{ totalPrice === null ? '—' : formatRp(totalPrice) }}</p>
        </div>
        <BaseButton size="lg" :disabled="!canPay" :loading="initiating" @click="handleBookEvent">
          {{ initiating ? 'Memproses...' : 'Bayar Sekarang' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Building, CalendarX, CircleCheck } from 'lucide-vue-next'
import { useEventBooking } from '@/composables/useEventBooking'
import { formatRp, formatDateLong } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookingStep from '@/components/booking/BookingStep.vue'
import BranchStep from '@/components/booking/BranchStep.vue'
import DateStep from '@/components/booking/DateStep.vue'
import PaymentMethodPicker from '@/components/booking/PaymentMethodPicker.vue'

const INPUT = 'w-full min-h-11 rounded-xl border border-border-subtle bg-surface-raised/60 px-4 text-sm text-q-text [color-scheme:dark] placeholder:text-q-text-3 focus:outline-none focus:border-q-primary focus:ring-2 focus:ring-q-primary/30'

const {
  stores, form, today, selectedStore, scheduleReady, durationHours, sameTime,
  availability, quoteError, totalPrice, canPay, initiating, bookingError,
  checkAvailability, handleBookEvent, init,
} = useEventBooking()

// ── Accordion ─────────────────────────────────────────────────────
const editingStep      = ref(null)
const detailsConfirmed = ref(false)

const currentStep = computed(() => {
  if (!form.storeId)                     return 0
  if (availability.value !== 'available') return 1
  if (!detailsConfirmed.value || !form.eventName.trim()) return 2
  return 3
})
const openStep = computed(() => editingStep.value ?? currentStep.value)

// Hasil cek baru → tutup mode "Ubah" supaya langkah berikutnya terbuka
watch(availability, (v) => { if (v === 'available') editingStep.value = null })

const scheduleLabel = computed(() =>
  form.date && form.startTime && form.endTime ? `${formatDateLong(form.date)} · ${form.startTime}–${form.endTime}` : '')

const steps = computed(() => [
  { title: 'Pilih Cabang', summary: selectedStore.value?.name ?? '' },
  { title: 'Jadwal',       summary: scheduleLabel.value },
  { title: 'Detail Event', summary: form.eventName },
  { title: 'Pembayaran',   summary: '' },
])

const summaryRows = computed(() => [
  { label: 'Cabang', value: selectedStore.value?.name ?? '—' },
  { label: 'Jadwal', value: scheduleLabel.value },
  { label: 'Durasi', value: `${durationHours.value} jam` },
  { label: 'Event',  value: form.eventName },
])

const chooseStore = (id) => {
  editingStep.value = null
  if (id === form.storeId) return
  Object.assign(form, { storeId: id, date: '', startTime: '', endTime: '' })
}

onMounted(init)
</script>
