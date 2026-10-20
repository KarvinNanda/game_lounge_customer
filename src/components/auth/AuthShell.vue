<template>
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
    <div class="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-q-primary/15 blur-3xl" aria-hidden="true" />
    <div class="relative w-full max-w-sm">
      <AuthBrand />
      <HudPanel brackets class="p-6">
        <h1 class="mb-1 font-display text-xl uppercase tracking-wide text-q-text">{{ title }}</h1>
        <p v-if="subtitle" class="mb-5 text-sm text-q-text-3">{{ subtitle }}</p>
        <slot />
      </HudPanel>
      <div class="mt-4 text-center">
        <RouterLink to="/login" class="inline-flex min-h-11 items-center gap-1.5 text-sm text-q-text-2 hover:text-q-primary-l hud-focus">
          <ArrowLeft class="size-4" aria-hidden="true" /> Kembali ke login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// Kerangka halaman auth (login/lupa/reset): glow halus + wordmark + panel HUD
import HudPanel from '@/components/ui/HudPanel.vue'
import AuthBrand from './AuthBrand.vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>
