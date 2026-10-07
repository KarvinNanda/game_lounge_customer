<template>
  <component
    :is="tag"
    :class="[
      'rounded-2xl border border-border-subtle bg-surface/80 overflow-hidden',
      interactive && [
        'group cursor-pointer transition-[transform,border-color,box-shadow] duration-300 ease-out-expo',
        'hover:-translate-y-0.5 hover:border-q-primary/60 hover:shadow-purple-sm',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
      ],
    ]"
  >
    <slot />
  </component>
</template>

<script setup>
defineProps({
  tag:         { type: [String, Object], default: 'div' },
  interactive: Boolean,
})
</script>
