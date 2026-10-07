<template>
  <span :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-4 whitespace-nowrap', TONES[tone]]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  tone: { type: String, default: 'neutral', validator: (v) => ['neutral', 'gold', 'success', 'danger', 'info', 'warning'].includes(v) },
})

const TONES = {
  neutral: 'bg-black/60 text-white backdrop-blur-sm',
  gold:    'bg-q-gold text-black',
  success: 'bg-q-green/15 text-q-green',
  danger:  'bg-q-red/15 text-q-red',
  info:    'bg-q-primary/15 text-q-primary-l',
  warning: 'bg-q-gold/15 text-q-gold',
}
</script>
