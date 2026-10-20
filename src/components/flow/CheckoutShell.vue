<template>
  <aside v-if="mode === 'panel'" data-checkout="panel" :aria-label="title" class="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain">
    <HudPanel class="p-4">
      <HudLabel tag="h2" class="mb-3">{{ title }}</HudLabel>
      <slot />
      <div v-if="$slots.footer" class="mt-4">
        <slot name="footer" />
      </div>
    </HudPanel>
  </aside>

  <section v-else data-checkout="screen" :aria-labelledby="titleId">
    <header class="mb-3 flex items-center gap-2">
      <button
        type="button"
        aria-label="Kembali ke pilihan"
        class="-ml-2 flex size-11 shrink-0 cursor-pointer items-center justify-center text-q-text-2 transition-colors hover:text-q-primary-l hud-focus"
        @click="emit('close')"
      >
        <ArrowLeft class="size-5" aria-hidden="true" />
      </button>
      <h2 :id="titleId" class="font-display text-lg uppercase tracking-wide text-q-text">{{ title }}</h2>
    </header>
    <slot />
    <div v-if="$slots.footer" class="mt-4">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup>
// panel  = desktop: ringkasan + pembayaran menempel di kanan
// screen = HP: layar checkout penuh (masuk lewat ?step=pay; tombol back HP kembali ke pilihan)
import { useId } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import HudPanel from '@/components/ui/HudPanel.vue'
import HudLabel from '@/components/ui/HudLabel.vue'

defineProps({
  title: { type: String, required: true },
  mode:  { type: String, required: true, validator: (v) => ['panel', 'screen'].includes(v) },
})
const emit = defineEmits(['close'])

const titleId = `checkout-${useId()}`
</script>
