<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:pb-10">
    <!-- ── HP: layar checkout (?step=pay) ── -->
    <template v-if="phoneCheckout">
      <h1 class="sr-only">Private Event</h1>
      <CheckoutShell mode="screen" title="Pembayaran" @close="closeCheckout">
        <div class="space-y-4">
          <HudPanel class="p-4">
            <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-q-green">
              <CircleCheck class="size-4" aria-hidden="true" /> Jadwal tersedia
            </p>
            <dl class="space-y-1.5 text-sm">
              <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
                <dt class="text-q-text-3">{{ row.label }}</dt>
                <dd class="text-right text-q-text">{{ row.value }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-t border-border-subtle pt-2">
                <dt class="text-q-text-2">Total</dt>
                <dd class="font-display text-lg text-q-primary-l tabular-nums">{{ totalLabel }}</dd>
              </div>
            </dl>
          </HudPanel>
          <div>
            <p class="hud-label mb-2">Metode pembayaran</p>
            <PaymentMethodPicker v-model="form.paymentMethod" />
          </div>
          <p v-if="bookingError" role="alert" class="hud-cut-sm bg-q-red/10 p-3 text-center text-sm text-q-red">{{ bookingError }}</p>
        </div>
      </CheckoutShell>
    </template>

    <!-- ── Loadout: cabang → jadwal → detail ── -->
    <template v-else>
      <PageHeader title="Private Event" subtitle="Sewa satu cabang penuh untuk acaramu">
        <template #actions>
          <FlowProgress :current="currentStep" :count="STEP_COUNT" class="mt-1.5" />
        </template>
      </PageHeader>

      <p class="hud-cut-sm mb-4 flex gap-2 bg-q-primary/10 p-3 text-xs text-q-text-2">
        <Building class="size-4 shrink-0 text-q-primary-l" aria-hidden="true" />
        Semua ruangan di cabang diblokir selama event berlangsung.
      </p>

      <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div class="space-y-5">
          <FlowStep
            v-for="(step, i) in STEPS"
            :key="step.title"
            data-step
            :index="i + 1"
            :title="step.title"
            :locked-hint="step.hint"
            :state="flow.stateOf(i)"
            :summary="summaries[i]"
            :cancelable="flow.editing.value === i"
            :expand-done="isDesktop"
            :last="i === STEP_COUNT - 1"
            @edit="flow.edit(i)"
            @cancel="flow.cancelEdit()"
          >
            <BranchStep v-if="i === 0" :stores="stores" :model-value="form.storeId" @select="chooseStore" />

            <!-- Jadwal -->
            <div v-else-if="i === 1" class="space-y-3">
              <DateStep v-model="form.date" :min="today" />
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="event-start" class="mb-1.5 block text-xs font-semibold text-q-text-2">Jam mulai</label>
                  <input id="event-start" v-model="form.startTime" type="time" class="hud-input" />
                </div>
                <div>
                  <label for="event-end" class="mb-1.5 block text-xs font-semibold text-q-text-2">Jam selesai</label>
                  <input id="event-end" v-model="form.endTime" type="time" class="hud-input" />
                </div>
              </div>
              <p v-if="sameTime" role="alert" class="text-xs text-q-red">Jam selesai harus berbeda dengan jam mulai.</p>
              <p v-else-if="durationHours > 0" class="text-xs text-q-text-3">
                Durasi {{ durationHours }} jam<template v-if="form.endTime < form.startTime"> (melewati tengah malam)</template>
              </p>

              <p v-if="availability === 'conflict'" role="alert" class="hud-cut-sm flex gap-2 bg-q-red/10 p-3 text-sm text-q-red">
                <CalendarX class="size-4 shrink-0" aria-hidden="true" /> Jam ini sudah dipakai booking atau event lain. Pilih jam lain.
              </p>
              <p v-else-if="availability === 'error'" role="alert" class="hud-cut-sm flex items-center justify-between gap-3 bg-q-red/10 p-3 text-sm text-q-red">
                {{ quoteError || 'Gagal mengecek ketersediaan.' }}
                <button v-if="!quoteError" type="button" class="min-h-11 shrink-0 cursor-pointer font-semibold text-q-text underline hud-focus" @click="checkAvailability">Coba lagi</button>
              </p>

              <BaseButton block variant="secondary" :disabled="!scheduleReady || durationHours <= 0" :loading="availability === 'checking'" @click="checkAvailability">
                Cek ketersediaan
              </BaseButton>
            </div>

            <!-- Detail -->
            <div v-else class="space-y-3">
              <div>
                <label for="event-name" class="mb-1.5 block text-xs font-semibold text-q-text-2">Nama event</label>
                <input id="event-name" v-model="form.eventName" type="text" maxlength="100" placeholder="Contoh: Ulang tahun, turnamen PS5" class="hud-input" />
              </div>
              <div>
                <label for="event-desc" class="mb-1.5 block text-xs font-semibold text-q-text-2">Catatan untuk admin (opsional)</label>
                <textarea id="event-desc" v-model="form.description" rows="2" maxlength="500" placeholder="Contoh: butuh dekorasi" class="hud-input resize-none" />
              </div>
            </div>
          </FlowStep>
        </div>

        <!-- Desktop: ringkasan + pembayaran di kanan -->
        <CheckoutShell v-if="isDesktop" mode="panel" title="Ringkasan">
          <dl class="space-y-1.5 text-sm">
            <div v-for="row in summaryRows" :key="row.label" class="flex justify-between gap-4">
              <dt class="text-q-text-3">{{ row.label }}</dt>
              <dd class="text-right text-q-text">{{ row.value || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4 border-t border-border-subtle pt-2">
              <dt class="text-q-text-2">Total</dt>
              <dd class="font-display text-lg text-q-primary-l tabular-nums">{{ totalLabel }}</dd>
            </div>
          </dl>
          <template v-if="flow.ready.value">
            <div class="mt-4 border-t border-border-subtle pt-4">
              <p class="hud-label mb-2">Metode pembayaran</p>
              <PaymentMethodPicker v-model="form.paymentMethod" />
            </div>
            <p v-if="bookingError" role="alert" class="hud-cut-sm mt-3 bg-q-red/10 p-3 text-center text-sm text-q-red">{{ bookingError }}</p>
          </template>
          <template #footer>
            <BaseButton size="lg" block :disabled="!flow.ready.value || !canPay" :loading="initiating" @click="handleBookEvent">
              {{ initiating ? 'Memproses...' : 'Bayar Sekarang' }}
            </BaseButton>
            <p v-if="!flow.ready.value" class="mt-2 text-center text-xs text-q-text-3">Lengkapi {{ flow.remaining.value }} langkah lagi</p>
          </template>
        </CheckoutShell>
      </div>
    </template>

    <PayBar
      v-if="!isDesktop"
      label="Total"
      :amount="totalLabel"
      :action-label="phoneCheckout ? (initiating ? 'Memproses...' : 'Bayar Sekarang') : 'Lanjut'"
      :disabled="phoneCheckout ? !canPay : !flow.ready.value"
      :loading="phoneCheckout && initiating"
      :hint="`Lengkapi ${flow.remaining.value} langkah lagi`"
      @action="phoneCheckout ? handleBookEvent() : openCheckout()"
    />
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { Building, CalendarX, CircleCheck } from 'lucide-vue-next'
import { useEventBooking } from '@/composables/useEventBooking'
import { formatRp, formatDateLong } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import FlowStep from '@/components/flow/FlowStep.vue'
import FlowProgress from '@/components/flow/FlowProgress.vue'
import PayBar from '@/components/flow/PayBar.vue'
import CheckoutShell from '@/components/flow/CheckoutShell.vue'
import { useFlowSteps } from '@/components/flow/useFlowSteps'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useCheckoutStep } from '@/composables/useCheckoutStep'
import { useToast } from '@/composables/useToast'
import BranchStep from '@/components/booking/BranchStep.vue'
import DateStep from '@/components/booking/DateStep.vue'
import PaymentMethodPicker from '@/components/booking/PaymentMethodPicker.vue'


const {
  stores, form, today, selectedStore, scheduleReady, durationHours, sameTime,
  availability, quoteError, totalPrice, canPay, initiating, bookingError,
  checkAvailability, handleBookEvent, init,
} = useEventBooking()

// ── Langkah berurutan: cabang → jadwal (harus tersedia) → detail, lalu checkout ──
const STEP_COUNT = 3
const STEPS = [
  { title: 'Pilih Cabang', hint: '' },
  { title: 'Jadwal',       hint: 'Pilih cabang dulu' },
  { title: 'Detail Event', hint: 'Cek jadwal dulu' },
]
const currentStep = computed(() => {
  if (!form.storeId)                     return 0
  if (availability.value !== 'available') return 1
  if (!form.eventName.trim())            return 2
  return 3
})
const toast     = useToast()
const flow      = useFlowSteps(STEP_COUNT, currentStep)
const isDesktop = useMediaQuery('(min-width: 1024px)')
const { inCheckout, open: openCheckout, close: closeCheckout } = useCheckoutStep(flow.ready)
const phoneCheckout = computed(() => inCheckout.value && !isDesktop.value)

const totalLabel = computed(() => (totalPrice.value === null ? '—' : formatRp(totalPrice.value)))

// Hasil cek baru → tutup mode "Ubah" supaya langkah berikutnya terbuka
watch(availability, (v) => { if (v === 'available') flow.cancelEdit() })

const scheduleLabel = computed(() =>
  form.date && form.startTime && form.endTime ? `${formatDateLong(form.date)} · ${form.startTime}–${form.endTime}` : '')

const summaries = computed(() => [selectedStore.value?.name ?? '', scheduleLabel.value, form.eventName])

const summaryRows = computed(() => [
  { label: 'Cabang', value: selectedStore.value?.name ?? '—' },
  { label: 'Jadwal', value: scheduleLabel.value },
  { label: 'Durasi', value: `${durationHours.value} jam` },
  { label: 'Event',  value: form.eventName },
])

const chooseStore = (id) => {
  flow.cancelEdit()
  if (id === form.storeId) return
  const hadSchedule = !!(form.date || form.startTime || form.endTime)
  Object.assign(form, { storeId: id, date: '', startTime: '', endTime: '' })
  if (hadSchedule) toast.info('Jadwal di-reset')
}

onMounted(init)
</script>
