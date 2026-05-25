<template>
  <div class="min-h-screen bg-q-bg flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <!-- Testing banner -->
      <div class="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-2 text-center mb-6">
        <span class="text-amber-400 text-xs font-semibold">⚠️ MODE TESTING — Simulasi Pembayaran</span>
      </div>

      <div class="bg-q-card border border-q-border rounded-3xl overflow-hidden">

        <!-- Header -->
        <div class="bg-q-primary/20 border-b border-q-border px-6 py-4 text-center">
          <div class="text-white font-black text-lg">Quantum Gaming Center</div>
          <div class="text-q-text-2 text-xs mt-0.5">Halaman Pembayaran (Mock)</div>
        </div>

        <div class="p-6">

          <!-- Amount -->
          <div class="text-center mb-6">
            <div class="text-q-text-2 text-sm mb-1">Total Pembayaran</div>
            <div class="text-3xl font-black text-white">
              {{ amount ? formatRp(Number(amount)) : '—' }}
            </div>
            <div class="text-q-text-3 text-xs mt-1">Invoice: {{ invoiceId || '—' }}</div>
          </div>

          <!-- Countdown -->
          <div class="bg-q-card2 rounded-xl p-3 mb-5 text-center">
            <div class="text-q-text-2 text-xs mb-0.5">Sisa waktu pembayaran</div>
            <div
              class="font-bold text-xl transition-colors"
              :class="timeLeft < 120 ? 'text-q-red' : 'text-white'"
            >
              {{ formatCountdown(timeLeft) }}
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-q-red text-sm text-center"
          >
            {{ error }}
          </div>

          <!-- Konfirmasi -->
          <button
            @click="handleConfirm"
            :disabled="confirming || timeLeft <= 0"
            class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="confirming">⏳ Memproses...</span>
            <span v-else-if="timeLeft <= 0">⌛ Waktu Habis</span>
            <span v-else>✅ Konfirmasi Pembayaran</span>
          </button>

          <!-- Batal -->
          <button
            @click="handleCancel"
            :disabled="confirming"
            class="w-full py-3 text-q-text-2 hover:text-white text-sm transition-colors"
          >
            ✕ Batalkan Pembayaran
          </button>

        </div>
      </div>

      <p class="text-center text-q-text-3 text-xs mt-4 leading-relaxed">
        Halaman ini hanya muncul saat Xendit belum terdaftar.<br />
        Setelah akun Xendit aktif, customer akan diarahkan ke halaman Xendit asli.
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/index'

const route  = useRoute()
const router = useRouter()

const invoiceId = route.query.invoice_id || ''
const amount    = route.query.amount     || 0
const holdId = route.query.hold_id
  || sessionStorage.getItem('quantum_hold_id')
  || ''

const confirming = ref(false)
const error      = ref('')
const timeLeft   = ref(15 * 60)

let countdownInterval = null

onMounted(() => {
  countdownInterval = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else clearInterval(countdownInterval)
  }, 1000)
})

onUnmounted(() => clearInterval(countdownInterval))

const handleConfirm = async () => {
  if (!holdId) {
    error.value = 'Hold ID tidak ditemukan. Silakan booking ulang.'
    return
  }
  confirming.value = true
  error.value      = ''
  try {
    const { data } = await api.post(`/customer/bookings/${holdId}/mock-confirm`)
    
    // Bersihkan sessionStorage setelah berhasil
    sessionStorage.removeItem('quantum_hold_id')

    router.push({
      name:  'PaymentSuccess',
      query: { booking_code: data.data?.booking_code },
    })
  } catch (e) {
    error.value      = e?.response?.data?.message || 'Gagal mengkonfirmasi pembayaran'
    confirming.value = false
  }
}

const handleCancel = () => router.push({ name: 'PaymentFailed' })

const formatRp = (price) => 'Rp ' + Math.round(price).toLocaleString('id-ID')

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
</script>
