<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to || undefined"
    :type="to ? undefined : type"
    :disabled="to ? undefined : (disabled || loading)"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  variant:  { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'ghost'].includes(v) },
  size:     { type: String, default: 'md',      validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  to:       { type: [String, Object], default: null },
  type:     { type: String, default: 'button' },
  loading:  Boolean,
  disabled: Boolean,
  block:    Boolean,
})

const VARIANTS = {
  primary:   'bg-q-primary-strong text-white shadow-purple-sm hover:bg-q-primary-d hover:shadow-purple',
  secondary: 'bg-surface-raised text-q-text border border-border-subtle hover:border-q-primary',
  ghost:     'text-q-text-2 hover:text-q-text hover:bg-white/5',
}

const SIZES = {
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold cursor-pointer select-none',
  'transition-[background-color,box-shadow,border-color,color,transform] duration-200 ease-out-expo active:scale-[0.98]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
  VARIANTS[props.variant],
  SIZES[props.size],
  props.block && 'w-full',
])
</script>
