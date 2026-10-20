<template>
  <footer class="border-t border-border-subtle bg-q-bg/80">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
      <div>
        <p class="font-display text-sm tracking-[0.06em] text-q-text">QUANTUM</p>
        <p class="hud-label">© {{ year }} Quantum Gaming Center</p>
      </div>
      <div class="flex items-center gap-4">
        <p class="text-sm text-q-text-3">Ikuti kami untuk update game &amp; promo terbaru</p>
        <SocialLinks size="sm" />
      </div>
    </div>
  </footer>
</template>

<script setup>
import SocialLinks from '@/components/SocialLinks.vue'

const year = new Date().getFullYear()
</script>
