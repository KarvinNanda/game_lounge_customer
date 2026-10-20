<template>
  <component :is="tag" :class="['hud-label', TONES[tone]]">
    <slot />
  </component>
</template>

<script setup>
// Label pendek bergaya HUD (mono, uppercase). Bukan untuk kalimat.
defineProps({
  tag:  { type: String, default: 'span' },
  tone: { type: String, default: 'muted', validator: (v) => ['muted', 'accent', 'success', 'warning'].includes(v) },
})

const TONES = {
  muted:   '',
  accent:  'text-q-primary-l!',
  success: 'text-q-green!',
  warning: 'text-q-gold!',
}
</script>
