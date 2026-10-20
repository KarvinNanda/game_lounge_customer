<template>
  <span :class="['hud-cut-sm inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold leading-4 whitespace-nowrap', TONES[tone]]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  tone: { type: String, default: 'neutral', validator: (v) => ['neutral', 'gold', 'success', 'danger', 'info', 'warning'].includes(v) },
})

const TONES = {
  neutral: 'bg-q-bg/80 text-q-text-2 shadow-[inset_0_0_0_1px_var(--color-q-border)]',
  gold:    'bg-q-gold text-q-bg',
  success: 'bg-q-green/15 text-q-green shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-green)_40%,transparent)]',
  danger:  'bg-q-red/15 text-q-red shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-red)_40%,transparent)]',
  info:    'bg-q-primary/15 text-q-primary-l shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-primary-l)_40%,transparent)]',
  warning: 'bg-q-gold/15 text-q-gold shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-gold)_40%,transparent)]',
}
</script>
