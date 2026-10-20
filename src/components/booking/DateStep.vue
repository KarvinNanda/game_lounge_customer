<template>
  <div class="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
    <button
      v-for="(day, i) in days"
      :key="day.value"
      type="button"
      data-day
      :aria-pressed="modelValue === day.value"
      :aria-label="day.long"
      class="hud-option flex min-h-12 flex-col items-center justify-center px-0.5 py-1.5"
      @click="emit('update:modelValue', day.value)"
    >
      <span class="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-q-text-3 leading-none" :class="i < 2 && 'text-q-primary-l normal-case tracking-normal'">{{ day.top }}</span>
      <span class="mt-1 text-sm font-bold leading-none tabular-nums">{{ day.num }}</span>
    </button>

    <!-- Tanggal di luar 7 hari: date picker native, tampil di sel kalender -->
    <button
      type="button"
      data-calendar
      :aria-pressed="outside"
      :aria-label="outside ? `Tanggal lain: ${formatDateLong(modelValue)}` : 'Pilih tanggal lain'"
      class="hud-option flex min-h-12 flex-col items-center justify-center px-0.5 py-1.5 text-q-primary-l"
      @click="openPicker"
    >
      <template v-if="outside">
        <span class="font-mono text-[9px] uppercase leading-none tracking-[0.08em] text-q-text-3">{{ outsideMonth }}</span>
        <span class="mt-1 text-sm font-bold leading-none text-q-text tabular-nums">{{ outsideDay }}</span>
      </template>
      <CalendarDays v-else class="size-4" aria-hidden="true" />
    </button>
    <label :for="inputId" class="sr-only">Atau pilih tanggal</label>
    <input
      :id="inputId"
      ref="input"
      type="date"
      tabindex="-1"
      :min="min"
      :value="modelValue"
      class="sr-only [color-scheme:dark]"
      @change="emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
import { computed, ref, useId } from 'vue'
import { CalendarDays } from 'lucide-vue-next'
import { localISODate, parseLocalDate } from '@/utils/dates'
import { formatDateLong } from '@/utils/format'

const props = defineProps({
  modelValue: { type: String, default: '' },
  min:        { type: String, required: true }, // hari ini (lokal)
})
const emit = defineEmits(['update:modelValue'])

const inputId = `booking-date-${useId()}`
const input   = ref(null)

// 7 hari mulai `min`: 2 sel pertama berlabel Hari ini / Besok, sisanya SEN…MIN
const days = computed(() => {
  const start = parseLocalDate(props.min)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const value = localISODate(d)
    return {
      value,
      num:  d.getDate(),
      top:  i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'short' }).replace('.', ''),
      long: i < 2 ? `${i === 0 ? 'Hari ini' : 'Besok'}, ${formatDateLong(value)}` : formatDateLong(value),
    }
  })
})

const outside      = computed(() => !!props.modelValue && !days.value.some((d) => d.value === props.modelValue))
const outsideDate  = computed(() => (outside.value ? parseLocalDate(props.modelValue) : null))
const outsideDay   = computed(() => outsideDate.value?.getDate() ?? '')
const outsideMonth = computed(() => outsideDate.value?.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '') ?? '')

const openPicker = () => {
  const el = input.value
  if (!el) return
  try {
    if (typeof el.showPicker === 'function') { el.showPicker(); return }
  } catch { /* showPicker butuh user gesture / tidak didukung → fallback */ }
  el.focus()
  el.click()
}
</script>
