<template>
  <div role="radiogroup" aria-label="Cabang" class="grid gap-1.5" @keydown="onRadioKeydownManual">
    <div v-for="(store, i) in stores" :key="store.id" class="flex min-w-0 items-stretch gap-1.5">
      <button
        type="button"
        role="radio"
        :aria-checked="store.id === modelValue"
        :tabindex="radioTabindex(store.id === modelValue, i, stores.some((s) => s.id === modelValue))"
        class="hud-option flex min-w-0 flex-1 items-center gap-2.5 p-2.5 text-left"
        @click="emit('select', store.id)"
      >
        <img v-if="store.photo_url" :src="getImgUrl(store.photo_url)" alt="" class="hud-cut-sm size-10 shrink-0 object-cover" />
        <span v-else class="hud-cut-sm flex size-10 shrink-0 items-center justify-center bg-surface-raised text-q-text-3">
          <Building2 class="size-5" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold">{{ store.name }}</span>
          <span class="block truncate text-xs text-q-text-3">{{ store.address }}</span>
          <span v-if="hoursOf(store)" class="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-q-green">
            <Clock class="size-3" aria-hidden="true" /> {{ hoursOf(store) }}
          </span>
        </span>
      </button>
      <a
        v-if="store.link_gmaps"
        :href="store.link_gmaps"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`Buka ${store.name} di Maps`"
        class="hud-option flex w-11 shrink-0 items-center justify-center text-q-primary-l"
      >
        <MapPin class="size-5" aria-hidden="true" />
      </a>
    </div>
  </div>
</template>

<script setup>
import { Building2, Clock, MapPin } from 'lucide-vue-next'
import { getImgUrl } from '@/utils/security'
import { onRadioKeydownManual, radioTabindex } from '@/utils/radioKeys'

defineProps({
  stores:     { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
})
const emit = defineEmits(['select'])

const hoursOf = (store) => {
  const h = store.operating_hours?.[0]
  return h ? `${h.open_time?.slice(0, 5)} – ${h.close_time?.slice(0, 5)}` : ''
}
</script>
