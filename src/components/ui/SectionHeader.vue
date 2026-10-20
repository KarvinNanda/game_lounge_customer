<template>
  <div class="mb-2 flex items-center justify-between gap-4">
    <h2 class="hud-label">{{ title }}</h2>
    <RouterLink
      v-if="to"
      :to="to"
      class="hud-label inline-flex min-h-11 items-center gap-1 text-q-primary-l! hover:text-q-text! transition-colors hud-focus"
    >
      {{ linkLabel }}
      <ChevronRight class="size-3.5" aria-hidden="true" />
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
