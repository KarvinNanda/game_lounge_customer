<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm text-center">
      <div class="text-5xl mb-4">❌</div>
      <h1 class="text-2xl font-bold text-white mb-2">Pembayaran Gagal</h1>
      <p class="text-q-text-2 text-sm mb-6">
        Pembayaran tidak berhasil. Silakan coba lagi.
      </p>
      <RouterLink to="/credits">
        <button class="w-full py-4 bg-gradient-purple text-white font-bold rounded-2xl mb-3 shadow-purple">
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
