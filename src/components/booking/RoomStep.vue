<template>
  <div v-if="loading" class="grid grid-cols-2 gap-1.5" aria-busy="true">
    <BaseSkeleton v-for="i in 4" :key="i" class="h-[58px]" />
  </div>

  <p v-else-if="!rooms.length" class="py-4 text-center text-sm text-q-text-3">Belum ada ruangan di cabang ini.</p>

  <div v-else>
    <div role="radiogroup" aria-label="Ruangan" class="grid grid-cols-2 gap-1.5" @keydown="onRadioKeydownManual">
      <button
        v-for="(room, i) in visibleRooms"
        :key="room.id"
        type="button"
        role="radio"
        :aria-checked="room.id === modelValue"
        :tabindex="radioTabindex(room.id === modelValue, i, visibleRooms.some((r) => r.id === modelValue))"
        class="hud-option flex min-w-0 items-center gap-2 p-2 text-left"
        @click="emit('select', room)"
      >
        <img v-if="room.image_url" :src="getImgUrl(room.image_url)" alt="" loading="lazy" class="hud-cut-sm size-10 shrink-0 object-cover" />
        <span v-else class="hud-cut-sm flex size-10 shrink-0 items-center justify-center bg-surface-raised text-q-text-3">
          <Gamepad2 class="size-5" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold">{{ room.name }}</span>
          <span class="block truncate text-xs text-q-text-3">
            <span class="font-semibold text-q-gold">{{ formatRp(room.min_price) }}</span>/jam
          </span>
          <span class="flex items-center gap-1 text-[11px] text-q-text-3">
            <Users class="size-3" aria-hidden="true" /> {{ formatCapacity(room.capacity_min, room.capacity_max) }}
          </span>
        </span>
      </button>
    </div>
    <button
      v-if="hiddenCount > 0"
      type="button"
      :aria-expanded="showAll"
      class="hud-label mt-1.5 min-h-11 w-full cursor-pointer text-q-primary-l! hover:text-q-text! hud-focus"
      @click="showAll = true"
    >+{{ hiddenCount }} lainnya</button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Gamepad2, Users } from 'lucide-vue-next'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { getImgUrl } from '@/utils/security'
import { formatRp, formatCapacity } from '@/utils/format'
import { onRadioKeydownManual, radioTabindex } from '@/utils/radioKeys'

const props = defineProps({
  rooms:      { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: 0 },
  loading:    Boolean,
})
const emit = defineEmits(['select'])

// Minim scroll: tampilkan 4 dulu, sisanya lewat "+N lainnya" (langsung terbuka kalau pilihan ada di sana)
const LIMIT   = 4
const selectedBeyondLimit = () => props.rooms.findIndex((r) => r.id === props.modelValue) >= LIMIT
const showAll = ref(selectedBeyondLimit())
// Deep link (Room Detail → Booking): daftar ruangan datang setelah mount
watch(() => [props.rooms, props.modelValue], () => { if (selectedBeyondLimit()) showAll.value = true })
const visibleRooms = computed(() => (showAll.value ? props.rooms : props.rooms.slice(0, LIMIT)))
const hiddenCount  = computed(() => (showAll.value ? 0 : Math.max(0, props.rooms.length - LIMIT)))
</script>
