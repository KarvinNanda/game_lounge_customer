<template>
  <div role="group" :aria-label="label" class="flex flex-wrap gap-2">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :aria-pressed="modelValue === opt.value"
      class="group relative isolate min-h-11 px-4 text-sm font-semibold cursor-pointer hud-press hud-focus"
      :class="modelValue === opt.value ? 'text-q-text drop-shadow-glow' : 'text-q-text-2 hover:text-q-text'"
      @click="emit('update:modelValue', opt.value)"
    >
      <HudFace :tone="modelValue === opt.value ? 'active' : 'default'" cut="sm" hoverable />
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
import HudFace from './HudFace.vue'

defineProps({
  options:    { type: Array, required: true }, // [{ label, value }]
  modelValue: { type: [String, Number, null], default: null },
  label:      { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])
</script>
