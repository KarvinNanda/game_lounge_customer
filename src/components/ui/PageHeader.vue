<template>
  <header class="mb-4 flex items-start gap-2">
    <button
      v-if="back"
      type="button"
      aria-label="Kembali"
      class="-ml-2 size-11 shrink-0 flex items-center justify-center text-q-text-2 hover:text-q-primary-l transition-colors cursor-pointer hud-focus"
      @click="goBack"
    >
      <ArrowLeft class="size-5" aria-hidden="true" />
    </button>
    <div class="min-w-0 flex-1 pt-1.5">
      <h1 tabindex="-1" class="font-display text-xl uppercase tracking-wide text-q-text focus:outline-none lg:text-2xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-0.5 text-sm text-q-text-2">{{ subtitle }}</p>
      <span aria-hidden="true" class="mt-2 block h-px origin-left animate-hud-scan bg-gradient-to-r from-q-primary-l via-q-primary/50 to-transparent" />
    </div>
    <div v-if="$slots.actions" class="shrink-0 pt-1">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  back:     { type: [Boolean, String], default: false }, // true = history back, string = path tujuan
})

const router = useRouter()
const goBack = () => (typeof props.back === 'string' ? router.push(props.back) : router.back())
</script>
