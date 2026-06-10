<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm text-center">

      <div class="text-7xl mb-5">✅</div>
      <h1 class="text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h1>
      <p class="text-q-text-2 text-sm mb-6 leading-relaxed">
        Terima kasih, pembayaran kamu telah berhasil.<br />
        Tunjukkan kode booking berikut kepada admin.
      </p>

      <!-- Kode Booking -->
      <div class="bg-q-card border border-q-primary rounded-2xl p-5 mb-4 text-left">
        <div class="text-q-text-2 text-xs mb-1 text-center">Kode Booking</div>
        <div class="text-3xl font-black text-q-primary tracking-wider text-center mb-3">
          {{ bookingCode || '—' }}
        </div>
        <button
          @click="copyCode"
          class="block w-full text-q-primary text-sm text-center hover:underline mb-3 transition-colors"
        >
          📋 Salin Kode
        </button>

        <!-- Screenshot reminder -->
        <div class="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2">
          <span class="text-lg flex-shrink-0">📸</span>
          <div>
            <div class="text-amber-400 text-xs font-bold mb-0.5">Jangan lupa di-screenshot!</div>
            <div class="text-amber-300/80 text-xs leading-relaxed">
              Screenshot halaman ini dan tunjukkan kode booking kepada admin saat tiba di tempat bermain.
            </div>
          </div>
        </div>
      </div>

      <div class="bg-q-card border border-q-border rounded-xl p-4 mb-6 text-sm">
        <div class="flex justify-between">
          <span class="text-q-text-2">Status Pembayaran</span>
          <span class="text-q-green font-semibold">Lunas ✓</span>
        </div>
      </div>

      <RouterLink to="/">
        <button class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl shadow-purple transition-colors">
          🏠 Kembali ke Beranda
        </button>
      </RouterLink>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { getMyBookings } from '@/api/bookingApi'

const toast       = useToast()
const bookingCode = ref('')

const copyCode = async () => {
  if (!bookingCode.value) return
  try {
    await navigator.clipboard.writeText(bookingCode.value)
    toast.success('Kode booking disalin!')
  } catch {
    toast.error('Gagal menyalin kode')
  }
}

onMounted(async () => {
  try {
    const { data } = await getMyBookings({ page: 1, per_page: 1 })
    bookingCode.value = data.data?.[0]?.booking_code || ''
  } catch {}
})
</script>
