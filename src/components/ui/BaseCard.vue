<template>
  <HudPanel :tag="tag" :interactive="interactive">
    <slot />
  </HudPanel>
</template>

<script setup>
import HudPanel from './HudPanel.vue'

// Alias lama — view baru sebaiknya langsung memakai HudPanel
defineProps({
  tag:         { type: [String, Object], default: 'div' },
  interactive: Boolean,
})
</script>
