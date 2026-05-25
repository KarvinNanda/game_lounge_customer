<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm text-center">

      <div class="text-7xl mb-5">❌</div>
      <h1 class="text-2xl font-bold text-white mb-2">Pembayaran Gagal</h1>
      <p class="text-q-text-2 text-sm mb-8 leading-relaxed">
        Pembayaran tidak berhasil atau waktu habis.<br />
        Silakan coba lagi dengan metode pembayaran lain.
      </p>

      <RouterLink to="/booking">
        <button class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl shadow-purple transition-colors mb-3">
          Coba Lagi
        </button>
      </RouterLink>

      <RouterLink to="/">
        <button class="w-full py-3 text-q-text-2 text-sm hover:text-white transition-colors">
          Kembali ke Beranda
        </button>
      </RouterLink>

    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
