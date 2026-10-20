<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to || undefined"
    :type="to ? undefined : type"
    :disabled="to ? undefined : (disabled || loading)"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <HudFace :tone="FACE[variant]" cut="sm" hoverable />
    <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
    <slot />
  </component>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { RouterLink } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import HudFace from './HudFace.vue'

const props = defineProps({
  variant:  { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v) },
  size:     { type: String, default: 'md',      validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  to:       { type: [String, Object], default: null },
  type:     { type: String, default: 'button' },
  loading:  Boolean,
  disabled: Boolean,
  block:    Boolean,
})

const attrs = useAttrs()

const FACE = { primary: 'primary', secondary: 'raised', ghost: 'ghost', danger: 'danger' }

const TEXT = {
  primary:   'text-white hover:drop-shadow-glow',
  secondary: 'text-q-text',
  ghost:     'text-q-text-2 hover:text-q-text',
  danger:    'text-q-red',
}

const SIZES = {
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

// Pemanggil yang memberi utility display sendiri (mis. `hidden lg:flex`) tidak boleh
// dikalahkan oleh inline-flex bawaan — dulu ini jebakan.
const DISPLAY = /(^|\s)(hidden|block|flex|inline-flex|grid|inline-block|contents)(\s|$)/
const hasOwnDisplay = computed(() => DISPLAY.test(String(attrs.class ?? '')))

const classes = computed(() => [
  !hasOwnDisplay.value && 'inline-flex',
  'group relative isolate items-center justify-center gap-2 font-semibold tracking-wide cursor-pointer select-none',
  'hud-press hud-focus',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  TEXT[props.variant],
  SIZES[props.size],
  props.block && 'w-full',
])
</script>
