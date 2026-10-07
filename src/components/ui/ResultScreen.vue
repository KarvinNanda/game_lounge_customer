<template>
  <section
    :data-tone="tone"
    :role="tone === 'error' ? 'alert' : 'status'"
    class="mx-auto w-full max-w-sm px-4 py-10 text-center"
  >
    <div
      class="result-icon mx-auto mb-5 size-20 rounded-full flex items-center justify-center"
      :class="TONES[tone].ring"
    >
      <component :is="TONES[tone].icon" class="size-10" :class="TONES[tone].text" aria-hidden="true" />
    </div>
    <h1 class="font-display text-2xl font-semibold text-q-text mb-2">{{ title }}</h1>
    <p v-if="message" class="text-q-text-2 text-sm mb-6">{{ message }}</p>
    <div v-if="$slots.default" class="mb-6 text-left">
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex flex-col gap-2">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup>
import { CircleCheck, CircleX, Clock } from 'lucide-vue-next'

defineProps({
  tone:    { type: String, default: 'success', validator: (v) => ['success', 'error', 'pending'].includes(v) },
  title:   { type: String, required: true },
  message: { type: String, default: '' },
})

const TONES = {
  success: { icon: CircleCheck, ring: 'bg-q-green/15', text: 'text-q-green' },
  error:   { icon: CircleX,     ring: 'bg-q-red/15',   text: 'text-q-red' },
  pending: { icon: Clock,       ring: 'bg-q-gold/15',  text: 'text-q-gold' },
}
</script>

<style scoped>
/* Pop halus sekali saat muncul — mati otomatis di prefers-reduced-motion (style.css) */
.result-icon { animation: result-pop 450ms var(--ease-out-expo) both; }
@keyframes result-pop {
  from { transform: scale(0.6); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
</style>
