<template>
  <div class="flex flex-col items-center px-4 py-12 text-center">
    <span class="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/5 text-q-text-3">
      <component :is="icon" class="size-7" aria-hidden="true" />
    </span>
    <h2 class="font-display text-lg font-semibold text-q-text">{{ title }}</h2>
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
