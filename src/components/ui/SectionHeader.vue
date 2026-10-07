<template>
  <div class="flex items-center justify-between gap-4 mb-3">
    <h2 class="font-display text-lg md:text-xl font-semibold tracking-tight text-q-text">{{ title }}</h2>
    <RouterLink
      v-if="to"
      :to="to"
      class="inline-flex items-center gap-1 min-h-11 rounded-md text-sm font-medium text-q-primary-l hover:text-q-text transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
    >
      {{ linkLabel }}
      <ChevronRight class="size-4" aria-hidden="true" />
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

defineProps({
  title:     { type: String, required: true },
  to:        { type: [String, Object], default: null },
  linkLabel: { type: String, default: 'Lihat semua' },
})
</script>
