<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm text-center">

      <!-- Loading: mock confirm in progress -->
      <div v-if="confirming" class="py-10">
        <div class="text-4xl mb-3 animate-spin inline-block">⏳</div>
        <p class="text-q-text-2">Mengkonfirmasi pembayaran...</p>
      </div>

      <!-- Success state -->
      <template v-else-if="!error">
        <div class="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
          <span class="text-4xl">✅</span>
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">Pembelian Berhasil!</h1>
        <p class="text-q-text-2 text-sm mb-6">
          Play Credits kamu sudah aktif.<br />
          Konfirmasi dikirim ke email kamu.
        </p>

        <!-- Detail credits -->
        <div class="bg-q-card border border-q-border rounded-2xl p-5 mb-6 text-left space-y-2 text-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-q-primary/20 flex items-center justify-center text-base">🎮</div>
            <span class="text-white font-bold">{{ packageName || 'Play Credits' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-q-text-2">Total Jam</span>
            <span class="text-white">{{ totalHours }} Jam</span>
          </div>
          <div class="flex justify-between">
            <span class="text-q-text-2">Masa Berlaku</span>
            <span class="text-white">{{ validityDays }} Hari</span>
          </div>
          <div class="flex justify-between">
            <span class="text-q-text-2">Status</span>
            <span class="text-green-400 font-semibold">Aktif ✓</span>
          </div>
        </div>

        <RouterLink to="/booking">
          <button class="w-full py-4 bg-gradient-purple text-white font-bold rounded-2xl shadow-purple mb-3">
            📅 Booking Sekarang
          </button>
        </RouterLink>
        <RouterLink to="/">
          <button class="w-full py-3 text-q-text-2 text-sm hover:text-white transition-colors">
            Kembali ke Beranda
          </button>
        </RouterLink>
      </template>

      <!-- Error state -->
      <template v-else>
        <div class="text-5xl mb-4">❌</div>
        <h1 class="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h1>
        <p class="text-q-text-2 text-sm mb-5">{{ error }}</p>
        <RouterLink to="/credits">
          <button class="w-full py-4 bg-gradient-purple text-white font-bold rounded-2xl">
            Coba Lagi
          </button>
        </RouterLink>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { mockConfirmPlayCredits } from '@/api/playCreditsApi'

const route        = useRoute()
const confirming   = ref(false)
const error        = ref('')
const packageName  = ref('')
const totalHours   = ref(0)
const validityDays = ref(0)

onMounted(async () => {
  // Cek apakah dari mock payment (perlu konfirmasi manual)
  const intentId = route.query.intent_id || sessionStorage.getItem('quantum_intent_id')

  if (intentId) {
    confirming.value = true
    try {
      const { data } = await mockConfirmPlayCredits(intentId)
      packageName.value  = data.data?.package_name  || ''
      totalHours.value   = data.data?.total_hours   || 0
      validityDays.value = data.data?.validity_days || 0
      sessionStorage.removeItem('quantum_intent_id')
    } catch (e) {
      error.value = e?.response?.data?.message || 'Gagal mengkonfirmasi pembayaran'
    } finally {
      confirming.value = false
    }
  } else {
    // Dari Xendit real — ambil data dari query params
    packageName.value  = route.query.package_name  || ''
    totalHours.value   = Number(route.query.total_hours)   || 0
    validityDays.value = Number(route.query.validity_days) || 0
  }
})
</script>
