<template>
  <div role="radiogroup" aria-label="Cabang" class="space-y-2" @keydown="onRadioKeydownManual">
    <div
      v-for="(store, i) in stores"
      :key="store.id"
      class="flex items-center gap-3 rounded-xl border p-3 transition-colors"
      :class="store.id === modelValue ? 'border-q-primary bg-q-primary/10' : 'border-border-subtle hover:border-q-primary/60'"
    >
      <button
        type="button"
        role="radio"
        :aria-checked="store.id === modelValue"
        :tabindex="radioTabindex(store.id === modelValue, i, stores.some((s) => s.id === modelValue))"
        class="flex flex-1 min-w-0 items-center gap-3 text-left cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-focus-ring"
        @click="emit('select', store.id)"
      >
        <img v-if="store.photo_url" :src="getImgUrl(store.photo_url)" alt="" class="size-12 rounded-lg object-cover shrink-0" />
        <span v-else class="size-12 shrink-0 rounded-lg bg-surface-raised flex items-center justify-center text-q-text-3">
          <Building2 class="size-5" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-q-text">{{ store.name }}</span>
          <span class="block text-xs text-q-text-3 line-clamp-1">{{ store.address }}</span>
          <span v-if="hoursOf(store)" class="mt-0.5 flex items-center gap-1 text-xs text-q-green">
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
        class="size-11 shrink-0 flex items-center justify-center rounded-full text-q-primary-l hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-focus-ring"
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
