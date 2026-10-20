<template>
  <component
    :is="tag"
    :data-tone="tone"
    :class="[
      'relative isolate block',
      interactive && 'group cursor-pointer hud-press hud-focus hover:drop-shadow-glow',
      tone === 'active' && 'drop-shadow-glow',
    ]"
  >
    <HudFace v-if="cut !== 'none'" :tone="FACE[tone]" :cut="cut" :hoverable="interactive" />
    <template v-if="brackets">
      <span data-bracket aria-hidden="true" class="pointer-events-none absolute right-1.5 top-1.5 size-2.5 border-r border-t border-q-primary-l" />
      <span data-bracket aria-hidden="true" class="pointer-events-none absolute bottom-1.5 left-1.5 size-2.5 border-b border-l border-q-primary-l" />
    </template>
    <slot />
  </component>
</template>

<script setup>
// Root = pemegang focus ring & glow (tidak di-clip). Latar chamfer ada di HudFace.
import HudFace from './HudFace.vue'

defineProps({
  tag:         { type: [String, Object], default: 'div' },
  interactive: Boolean,
  brackets:    Boolean,
  tone:        { type: String, default: 'default', validator: (v) => ['default', 'raised', 'active', 'primary'].includes(v) },
  cut:         { type: String, default: 'md', validator: (v) => ['md', 'sm', 'none'].includes(v) },
})

const FACE = { default: 'default', raised: 'raised', active: 'active', primary: 'primary' }
</script>
