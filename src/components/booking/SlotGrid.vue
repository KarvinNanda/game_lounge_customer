<template>
  <div>
    <p class="mb-2 flex items-center gap-1.5 font-mono text-[11px] text-q-green">
      <Clock class="size-3.5" aria-hidden="true" /> Jam operasional {{ hours }}
    </p>

    <div v-if="loading" class="grid grid-cols-5 gap-1.5 lg:grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]" aria-busy="true">
      <BaseSkeleton v-for="i in 10" :key="i" class="h-11" />
    </div>

    <p v-else-if="!slots.length" class="py-4 text-center text-sm text-q-text-3">Tidak ada slot tersedia untuk tanggal ini.</p>

    <template v-else>
      <div class="grid grid-cols-5 gap-1.5 lg:grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]">
        <button
          v-for="slot in slots"
          :key="slot.start_time"
          type="button"
          data-slot
          data-solid
          :disabled="!slot.available"
          :aria-pressed="selected.includes(slot.start_time)"
          class="hud-option min-h-11 font-mono text-sm font-semibold tabular-nums"
          @click="emit('toggle', slot.start_time)"
        >
          {{ slot.start_time }}
          <span v-if="!slot.available" class="sr-only">penuh</span>
        </button>
      </div>

      <div v-if="selected.length" class="mt-2 flex items-center justify-between gap-3">
        <p class="text-sm text-q-text">
          <span class="font-mono font-semibold tabular-nums text-q-primary-l">{{ selected[0] }}–{{ addHour(selected[selected.length - 1]) }}</span>
          <span class="text-q-text-2"> · {{ selected.length }} jam</span>
        </p>
        <button
          type="button"
          data-clear
          class="hud-label min-h-11 shrink-0 cursor-pointer px-1 text-q-red! hover:underline hud-focus"
          @click="emit('clear')"
        >Hapus pilihan</button>
      </div>
      <p v-else class="mt-2 text-xs text-q-text-3">Pilih jam berurutan. Ketuk jam terpilih untuk memendekkan.</p>
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
