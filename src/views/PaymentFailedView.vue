<template>
  <ResultScreen
    tone="error"
    title="Pembayaran Gagal"
    message="Pembayaran tidak berhasil atau waktunya habis. Slot kamu sudah dilepas, silakan coba lagi."
  >
    <template #actions>
      <BaseButton to="/booking" size="lg" block>Coba lagi</BaseButton>
      <BaseButton to="/" variant="ghost" block>Kembali ke Beranda</BaseButton>
    </template>
  </ResultScreen>
</template>

<script setup>
import ResultScreen from '@/components/ui/ResultScreen.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>
