<template>
  <section
    class="rounded-2xl border transition-colors duration-200"
    :class="open ? 'border-q-primary/50 bg-surface' : 'border-border-subtle bg-surface/60'"
  >
    <button
      v-if="done && !open"
      type="button"
      aria-expanded="false"
      class="flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-focus-ring"
      @click="emit('edit')"
    >
      <span class="size-7 shrink-0 rounded-full bg-q-primary-strong text-white flex items-center justify-center">
        <Check class="size-4" aria-hidden="true" />
      </span>
      <span class="flex-1 min-w-0">
        <span class="block text-xs text-q-text-3">{{ title }}</span>
        <span class="block text-sm font-semibold text-q-text truncate">{{ summary }}</span>
      </span>
      <span class="text-q-primary-l text-xs font-semibold">Ubah</span>
    </button>

    <div v-else class="flex items-center gap-3 px-4 pt-4" :class="open ? 'pb-3' : 'pb-4'">
      <span
        class="size-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
        :class="open ? 'bg-q-primary-strong text-white' : 'border border-border-subtle text-q-text-3'"
      >{{ index }}</span>
      <h2 class="font-display text-[15px] font-semibold" :class="open ? 'text-q-text' : 'text-q-text-3'">{{ title }}</h2>
    </div>

    <div v-if="open" class="px-4 pb-4">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  index:   { type: Number, required: true },
  title:   { type: String, required: true },
  summary: { type: String, default: '' },
  open:    Boolean,
  done:    Boolean,
})
const emit = defineEmits(['edit'])
</script>
