<template>
  <ResultScreen
    tone="success"
    title="Pembayaran Berhasil"
    :message="message"
  >
    <BaseCard v-if="isEvent" class="p-5 text-center">
      <p class="text-xs text-q-text-3">Event</p>
      <p class="mt-1 font-display text-xl font-semibold text-q-text">{{ eventName || 'Private Event' }}</p>
    </BaseCard>

    <BaseCard v-else-if="waiting" class="p-5 text-center" role="status" aria-live="polite">
      <Loader2 class="mx-auto size-5 animate-spin text-q-primary-l" aria-hidden="true" />
      <p class="mt-2 text-sm text-q-text-2">Mengonfirmasi pembayaran…</p>
    </BaseCard>

    <BaseCard v-else-if="bookingCode" class="p-5">
      <p class="text-center text-xs text-q-text-3">Kode Booking</p>
      <p class="mt-1 text-center font-display text-3xl font-bold tracking-wider text-q-primary-l tabular-nums">
        {{ bookingCode }}
      </p>
      <BaseButton class="mt-3" variant="ghost" size="sm" block @click="copyCode">
        <Copy class="size-4" aria-hidden="true" /> Salin kode
      </BaseButton>
      <p class="mt-3 flex gap-2 rounded-xl bg-q-gold/10 p-3 text-xs text-q-gold">
        <Camera class="size-4 shrink-0" aria-hidden="true" />
        Simpan screenshot halaman ini untuk ditunjukkan ke admin.
      </p>
    </BaseCard>

    <template #actions>
      <BaseButton to="/my-bookings" size="lg" block>Lihat booking saya</BaseButton>
      <BaseButton to="/" variant="ghost" block>Kembali ke Beranda</BaseButton>
    </template>
  </ResultScreen>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Copy, Camera, Loader2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useHoldConfirmation } from '@/composables/useHoldConfirmation'
import ResultScreen from '@/components/ui/ResultScreen.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const route = useRoute()
const toast = useToast()

// Query bisa diisi siapa saja (link dibagikan) — jangan tampilkan teks bebas di halaman "Berhasil"
const BOOKING_CODE_RE = /^[A-Z0-9-]{4,32}$/i
const EVENT_NAME_MAX  = 60
const queryString = (v) => (typeof v === 'string' ? v : '') // ?a=1&a=2 → array → abaikan

const isEvent     = computed(() => route.query.type === 'event')
const eventName   = computed(() => queryString(route.query.event_name).slice(0, EVENT_NAME_MAX))
const queryCode   = queryString(route.query.booking_code)
const urlCode     = BOOKING_CODE_RE.test(queryCode) ? queryCode : ''

// Redirect dari Xendit hanya membawa hold_id; kode booking dibuat setelah webhook masuk, jadi di-polling.
// Jangan menebak dari list /customer/bookings: urutannya menurut jadwal, jadi bisa kode booking lain.
const hold        = !isEvent.value && !urlCode ? useHoldConfirmation(queryString(route.query.hold_id)) : null
const waiting     = computed(() => hold?.state.value === 'checking')
const bookingCode = computed(() => urlCode || hold?.bookingCode.value || '')

const message = computed(() => {
  if (isEvent.value)      return 'Event kamu sudah terkonfirmasi.'
  if (waiting.value)      return 'Sebentar, kode booking sedang disiapkan.'
  if (bookingCode.value)  return 'Tunjukkan kode booking ini ke admin saat tiba.'
  return 'Kode booking kamu ada di My Bookings. Tunjukkan ke admin saat tiba.'
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(bookingCode.value)
    toast.success('Kode booking disalin')
  } catch {
    toast.error('Gagal menyalin kode')
  }
}

</script>
