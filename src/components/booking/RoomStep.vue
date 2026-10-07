<template>
  <div v-if="loading" class="space-y-2" aria-busy="true">
    <BaseSkeleton v-for="i in 3" :key="i" class="h-20" />
  </div>

  <p v-else-if="!rooms.length" class="py-6 text-center text-sm text-q-text-3">Belum ada ruangan di cabang ini.</p>

  <div v-else role="radiogroup" aria-label="Ruangan" class="space-y-2" @keydown="onRadioKeydownManual">
    <button
      v-for="(room, i) in rooms"
      :key="room.id"
      type="button"
      role="radio"
      :aria-checked="room.id === modelValue"
      :tabindex="radioTabindex(room.id === modelValue, i, rooms.some((r) => r.id === modelValue))"
      class="flex w-full items-center gap-3 rounded-xl border p-3 text-left cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
      :class="room.id === modelValue ? 'border-q-primary bg-q-primary/10' : 'border-border-subtle hover:border-q-primary/60'"
      @click="emit('select', room)"
    >
      <img v-if="room.image_url" :src="getImgUrl(room.image_url)" alt="" loading="lazy" class="size-14 rounded-lg object-cover shrink-0" />
      <span v-else class="size-14 shrink-0 rounded-lg bg-surface-raised flex items-center justify-center text-q-text-3">
        <Gamepad2 class="size-6" aria-hidden="true" />
      </span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-semibold text-q-text">{{ room.name }}</span>
        <span class="mt-0.5 flex items-center gap-1 text-xs text-q-text-3">
          <Users class="size-3" aria-hidden="true" /> {{ formatCapacity(room.capacity_min, room.capacity_max) }}
        </span>
      </span>
      <span class="shrink-0 text-right">
        <span class="block text-xs text-q-text-3">mulai</span>
        <span class="block text-sm font-semibold text-q-gold">{{ formatRp(room.min_price) }}</span>
        <span class="block text-[11px] text-q-text-3">/ jam</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { Gamepad2, Users } from 'lucide-vue-next'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { getImgUrl } from '@/utils/security'
import { formatRp, formatCapacity } from '@/utils/format'
import { onRadioKeydownManual, radioTabindex } from '@/utils/radioKeys'

defineProps({
  rooms:      { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: 0 },
  loading:    Boolean,
})
const emit = defineEmits(['select'])
</script>
