<template>
  <ResultScreen
    tone="success"
    title="Pembayaran Berhasil"
    :message="isEvent ? 'Event kamu sudah terkonfirmasi.' : 'Tunjukkan kode booking ini ke admin saat tiba.'"
  >
    <BaseCard v-if="isEvent" class="p-5 text-center">
      <p class="text-xs text-q-text-3">Event</p>
      <p class="mt-1 font-display text-xl font-semibold text-q-text">{{ eventName || 'Private Event' }}</p>
    </BaseCard>

    <BaseCard v-else class="p-5">
      <p class="text-center text-xs text-q-text-3">Kode Booking</p>
      <p class="mt-1 text-center font-display text-3xl font-bold tracking-wider text-q-primary-l tabular-nums">
        {{ bookingCode || '—' }}
      </p>
      <BaseButton v-if="bookingCode" class="mt-3" variant="ghost" size="sm" block @click="copyCode">
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Copy, Camera } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { getMyBookings } from '@/api/bookingApi'
import ResultScreen from '@/components/ui/ResultScreen.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const route = useRoute()
const toast = useToast()

const isEvent     = computed(() => route.query.type === 'event')
const eventName   = computed(() => String(route.query.event_name || ''))
const bookingCode = ref(String(route.query.booking_code || ''))

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(bookingCode.value)
    toast.success('Kode booking disalin')
  } catch {
    toast.error('Gagal menyalin kode')
  }
}

// Kembali dari payment gateway tidak membawa kode → ambil booking terbaru
onMounted(async () => {
  if (isEvent.value || bookingCode.value) return
  try {
    const { data } = await getMyBookings({ page: 1, per_page: 1 })
    bookingCode.value = data.data?.[0]?.booking_code || ''
  } catch {}
})
</script>
