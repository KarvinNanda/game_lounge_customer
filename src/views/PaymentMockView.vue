<template>
  <div class="flex min-h-dvh items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <p class="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-q-gold/10 px-4 py-2 text-xs font-semibold text-q-gold">
        <FlaskConical class="size-4" aria-hidden="true" /> Mode testing — simulasi pembayaran
      </p>

      <BaseCard class="shadow-card">
        <header class="border-b border-border-subtle bg-q-primary/10 px-6 py-4 text-center">
          <h1 class="font-display text-lg font-semibold text-q-text">Quantum Gaming Center</h1>
          <p class="text-xs text-q-text-3">Halaman pembayaran (mock)</p>
        </header>

        <div class="p-6">
          <div class="mb-5 text-center">
            <p class="text-sm text-q-text-2">Total pembayaran</p>
            <p class="font-display text-3xl font-bold text-q-text tabular-nums">{{ amount ? formatRp(Number(amount)) : '—' }}</p>
            <p class="mt-1 text-xs text-q-text-3">Invoice: {{ invoiceId || '—' }}</p>
          </div>

          <div v-if="timeLeft !== null" class="mb-5 rounded-xl bg-surface-raised/60 p-3 text-center">
            <p class="text-xs text-q-text-2">Sisa waktu pembayaran</p>
            <p
              class="font-display text-xl font-semibold tabular-nums transition-colors"
              :class="timeLeft < 120 ? 'text-q-red' : 'text-q-text'"
              role="timer"
            >{{ formatCountdown(timeLeft) }}</p>
          </div>

          <p v-if="error" role="alert" class="mb-4 rounded-xl bg-q-red/10 p-3 text-center text-sm text-q-red">{{ error }}</p>

          <BaseButton size="lg" block :loading="confirming" :disabled="timeLeft === 0" @click="handleConfirm">
            <template v-if="confirming">Memproses...</template>
            <template v-else-if="timeLeft === 0">Waktu Habis</template>
            <template v-else>Konfirmasi Pembayaran</template>
          </BaseButton>
          <BaseButton class="mt-2" variant="ghost" block :disabled="confirming" @click="handleCancel">
            Batalkan pembayaran
          </BaseButton>
        </div>
      </BaseCard>

      <p class="mt-4 text-center text-xs leading-relaxed text-q-text-3">
        Halaman ini hanya aktif di dev/staging (VITE_ENABLE_MOCK_PAYMENT).
        Di production customer diarahkan ke halaman Xendit.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/index'
import { paymentSecondsLeft, clearPaymentSession } from '@/utils/payment'
import { FlaskConical } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const route  = useRoute()
const router = useRouter()

const invoiceId  = route.query.invoice_id || ''
const amount     = route.query.amount     || 0
const intentType = route.query.type       || 'booking' // 'booking' | 'credits'
const intentId   = route.query.intent_id
  || route.query.hold_id
  || route.query.event_id
  || sessionStorage.getItem('quantum_intent_id')
  || sessionStorage.getItem('quantum_hold_id')
  || sessionStorage.getItem('quantum_event_id')
  || ''

const confirming = ref(false)
const error      = ref('')
// null = expires_at tidak diketahui → countdown disembunyikan (jangan tebak durasi)
const timeLeft   = ref(paymentSecondsLeft())

let countdownInterval = null

onMounted(() => {
  if (timeLeft.value === null) return
  // Hitung ulang dari jam, bukan decrement — tetap akurat walau tab sempat di-background
  countdownInterval = setInterval(() => {
    timeLeft.value = paymentSecondsLeft()
    if (!timeLeft.value) clearInterval(countdownInterval)
  }, 1000)
})

onUnmounted(() => clearInterval(countdownInterval))

const handleConfirm = async () => {
  if (!intentId) {
    error.value = 'ID transaksi tidak ditemukan. Silakan ulangi proses.'
    return
  }
  confirming.value = true
  error.value      = ''
  try {
    if (intentType === 'credits') {
      const { data } = await api.post(`/customer/play-credits/purchase/${intentId}/mock-confirm`)
      clearPaymentSession()
      router.push({
        name:  'CreditsSuccess',
        query: {
          package_name:  data.data?.package_name,
          total_hours:   data.data?.total_hours,
          validity_days: data.data?.validity_days,
        },
      })
    } else if (intentType === 'event') {
      const { data } = await api.post(`/customer/event-bookings/${intentId}/mock-confirm`)
      clearPaymentSession()
      router.push({
        name:  'PaymentSuccess',
        query: { type: 'event', event_name: data.data?.event_name },
      })
    } else {
      const { data } = await api.post(`/customer/bookings/${intentId}/mock-confirm`)
      clearPaymentSession()
      router.push({
        name:  'PaymentSuccess',
        query: { booking_code: data.data?.booking_code },
      })
    }
  } catch (e) {
    error.value      = e?.response?.data?.message || 'Gagal mengkonfirmasi pembayaran'
    confirming.value = false
  }
}

const handleCancel = () => {
  clearPaymentSession()
  router.push({ name: intentType === 'credits' ? 'CreditsFailed' : 'PaymentFailed' })
}

const formatRp = (price) => 'Rp ' + Math.round(price).toLocaleString('id-ID')

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
</script>
