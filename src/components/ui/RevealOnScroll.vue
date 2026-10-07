<template>
  <component
    :is="tag"
    ref="el"
    class="reveal"
    :class="{ 'is-visible': visible }"
    :style="{ '--reveal-delay': `${delay}ms` }"
  >
    <slot />
  </component>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  tag:   { type: String, default: 'div' },
  delay: { type: Number, default: 0 },
})

const el      = ref(null)
const visible = ref(false)
let observer  = null

onMounted(() => {
  // Browser tanpa IntersectionObserver: tampilkan langsung, jangan sampai konten tersangkut di opacity 0
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    visible.value = true
    observer.disconnect()
    observer = null
  }, { rootMargin: '0px 0px -10% 0px' })
  observer.observe(el.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>
