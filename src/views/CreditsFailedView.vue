<template>
  <ResultScreen tone="error" title="Pembayaran Gagal" message="Pembayaran tidak berhasil atau waktunya habis. Silakan coba lagi.">
    <template #actions>
      <BaseButton to="/credits" size="lg" block>Coba lagi</BaseButton>
      <BaseButton to="/" variant="ghost" block>Kembali ke Beranda</BaseButton>
    </template>
  </ResultScreen>
</template>

<script setup>
import ResultScreen from '@/components/ui/ResultScreen.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>
