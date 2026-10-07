<template>
  <!-- Kerangka halaman auth (login/lupa/reset): glow halus + wordmark + kartu -->
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
    <div class="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-q-primary/15 blur-3xl" aria-hidden="true" />
    <div class="relative w-full max-w-sm">
      <div class="mb-6 text-center">
        <div class="font-display text-3xl font-bold tracking-wide text-q-text">Quantum</div>
        <div class="text-xs font-medium uppercase tracking-[0.25em] text-q-text-3">Gaming Center</div>
      </div>
      <div class="rounded-3xl border border-border-subtle bg-surface/80 p-6 shadow-card backdrop-blur-sm">
        <h1 class="mb-1 font-display text-xl font-semibold text-q-text">{{ title }}</h1>
        <p v-if="subtitle" class="mb-5 text-sm text-q-text-3">{{ subtitle }}</p>
        <slot />
      </div>
      <div class="mt-4 text-center">
        <RouterLink to="/login" class="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-q-text-2 hover:text-q-text focus-visible:outline-2 focus-visible:outline-focus-ring">
          <ArrowLeft class="size-4" aria-hidden="true" /> Kembali ke login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>
