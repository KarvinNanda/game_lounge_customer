<template>
  <div class="flex items-center gap-3">
    <div
      role="progressbar"
      aria-valuemin="0"
      :aria-valuenow="current"
      :aria-valuemax="count"
      :aria-valuetext="`${current} dari ${count} langkah`"
      class="flex w-28 gap-1 lg:w-44"
    >
      <span
        v-for="n in count"
        :key="n"
        data-segment
        :data-done="n <= current || undefined"
        class="h-[3px] flex-1 transition-colors duration-150"
        :class="n <= current ? 'bg-q-primary-l shadow-glow-l' : 'bg-q-border'"
      />
    </div>
    <span v-if="current >= count" class="hud-label text-q-green!">READY</span>
    <span v-else class="hud-label tabular-nums">{{ current }}/{{ count }}</span>
  </div>
</template>

<script setup>
defineProps({
  current: { type: Number, required: true },
  count:   { type: Number, required: true },
})
</script>
