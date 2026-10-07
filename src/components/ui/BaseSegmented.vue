<template>
  <div role="group" :aria-label="label" class="flex flex-wrap gap-2">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :aria-pressed="modelValue === opt.value"
      class="min-h-11 rounded-full border px-4 text-sm font-medium cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
      :class="modelValue === opt.value ? 'border-q-primary bg-q-primary/15 text-q-text' : 'border-border-subtle text-q-text-2 hover:border-q-primary/60'"
      @click="emit('update:modelValue', opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>

<script setup>
defineProps({
  options:    { type: Array, required: true }, // [{ label, value }]
  modelValue: { type: [String, Number, null], default: null },
  label:      { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])
</script>
