<template>
  <div>
    <p class="mb-3 flex items-center gap-1.5 text-xs text-q-text-3">
      <Clock class="size-3.5" aria-hidden="true" /> Jam operasional {{ hours }}
    </p>

    <div v-if="loading" class="grid grid-cols-4 sm:grid-cols-6 gap-2" aria-busy="true">
      <BaseSkeleton v-for="i in 12" :key="i" class="h-11 !rounded-xl" />
    </div>

    <p v-else-if="!slots.length" class="py-6 text-center text-sm text-q-text-3">Tidak ada slot tersedia untuk tanggal ini.</p>

    <template v-else>
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
        <button
          v-for="slot in slots"
          :key="slot.start_time"
          type="button"
          data-slot
          :disabled="!slot.available"
          :aria-pressed="selected.includes(slot.start_time)"
          class="min-h-11 rounded-xl border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          :class="!slot.available
            ? 'border-transparent bg-white/[0.03] text-q-text-3/50 line-through cursor-not-allowed'
            : selected.includes(slot.start_time)
              ? 'border-q-primary bg-q-primary-strong text-white cursor-pointer'
              : 'border-border-subtle text-q-text hover:border-q-primary/60 cursor-pointer'"
          @click="emit('toggle', slot.start_time)"
        >
          {{ slot.start_time }}
          <span v-if="!slot.available" class="sr-only">penuh</span>
        </button>
      </div>

      <div v-if="selected.length" class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-q-primary/10 px-3 py-2">
        <p class="text-sm text-q-text">
          <span class="font-semibold tabular-nums">{{ selected[0] }}–{{ addHour(selected[selected.length - 1]) }}</span>
          <span class="text-q-text-2"> · {{ selected.length }} jam</span>
        </p>
        <button
          type="button"
          data-clear
          class="min-h-11 shrink-0 px-2 text-xs font-semibold text-q-red hover:underline cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-focus-ring"
          @click="emit('clear')"
        >Hapus pilihan</button>
      </div>
      <p class="mt-2 text-xs text-q-text-3">Pilih jam berurutan. Ketuk jam terpilih untuk memendekkan.</p>
    </template>
  </div>
</template>

<script setup>
import { Clock } from 'lucide-vue-next'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { addHour } from '@/utils/dates'

defineProps({
  slots:    { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  hours:    { type: String, default: '' },
  loading:  Boolean,
})
const emit = defineEmits(['toggle', 'clear'])
</script>
