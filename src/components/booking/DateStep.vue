<template>
  <div>
    <div class="mb-3 flex flex-wrap gap-2">
      <button
        v-for="chip in chips"
        :key="chip.value"
        type="button"
        :aria-pressed="modelValue === chip.value"
        class="min-h-11 rounded-full border px-4 text-sm font-medium cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
        :class="modelValue === chip.value ? 'border-q-primary bg-q-primary/15 text-q-text' : 'border-border-subtle text-q-text-2 hover:border-q-primary/60'"
        @click="emit('update:modelValue', chip.value)"
      >{{ chip.label }}</button>
    </div>
    <label :for="inputId" class="mb-1.5 block text-xs font-medium text-q-text-2">Atau pilih tanggal</label>
    <input
      :id="inputId"
      type="date"
      :min="min"
      :value="modelValue"
      class="w-full min-h-11 rounded-xl border border-border-subtle bg-surface-raised/60 px-4 text-sm text-q-text [color-scheme:dark] focus:outline-none focus:border-q-primary focus:ring-2 focus:ring-q-primary/30"
      @change="emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'
import { localISODate, parseLocalDate } from '@/utils/dates'

const props = defineProps({
  modelValue: { type: String, default: '' },
  min:        { type: String, required: true }, // hari ini (lokal)
})
const emit = defineEmits(['update:modelValue'])

const inputId = `booking-date-${useId()}`

const chips = computed(() => {
  const tomorrow = parseLocalDate(props.min)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return [
    { label: 'Hari ini', value: props.min },
    { label: 'Besok',    value: localISODate(tomorrow) },
  ]
})
</script>
