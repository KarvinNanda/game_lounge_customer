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
      <div class="bg-q-card border border-q-primary/40 rounded-2xl p-6 mb-5">
        <div class="text-q-text-2 text-xs mb-1">Kode Booking</div>
        <div class="text-3xl font-black text-q-primary tracking-widest mb-3">
          {{ bookingCode || '—' }}
        </div>
        <button
          @click="copyCode"
          class="text-q-primary text-sm hover:text-q-primary-l transition-colors flex items-center gap-1.5 mx-auto"
        >
          📋 Salin Kode
        </button>
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
