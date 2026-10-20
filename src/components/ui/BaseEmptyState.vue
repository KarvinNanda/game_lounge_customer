<template>
  <div class="flex flex-col items-center px-4 py-10 text-center">
    <span class="hud-hex mb-4 flex size-16 items-center justify-center bg-q-primary/10 text-q-primary-l">
      <component :is="icon" class="size-7" aria-hidden="true" />
    </span>
    <h2 class="font-display text-lg uppercase tracking-wide text-q-text">{{ title }}</h2>
    <p v-if="text" class="mt-1 max-w-xs text-sm text-q-text-3">{{ text }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon:  { type: [Object, Function], required: true },
  title: { type: String, required: true },
  text:  { type: String, default: '' },
})
</script>
