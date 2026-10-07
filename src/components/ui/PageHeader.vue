<template>
  <header class="flex items-start gap-2 mb-5">
    <button
      v-if="back"
      type="button"
      aria-label="Kembali"
      class="-ml-2 size-11 shrink-0 flex items-center justify-center rounded-full text-q-text-2 hover:text-q-text hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
      @click="goBack"
    >
      <ArrowLeft class="size-5" aria-hidden="true" />
    </button>
    <div class="flex-1 min-w-0 pt-1.5">
      <h1 class="font-display text-2xl font-semibold tracking-tight text-q-text">{{ title }}</h1>
      <p v-if="subtitle" class="text-q-text-2 text-sm mt-0.5">{{ subtitle }}</p>
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
