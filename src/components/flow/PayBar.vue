<template>
  <div
    data-pay-bar
    class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-border-subtle bg-q-bg/95 backdrop-blur-xl lg:hidden"
  >
    <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
      <div class="min-w-0 flex-1">
        <p class="hud-label truncate">{{ label }}</p>
        <p v-if="error" class="text-xs text-q-red">
          Harga gagal dimuat ·
          <button type="button" class="min-h-11 cursor-pointer font-semibold underline hud-focus" @click="emit('retry')">Coba lagi</button>
        </p>
        <p v-else data-total class="truncate font-display text-lg leading-tight text-q-text tabular-nums">{{ amount }}</p>
      </div>
      <div class="shrink-0 text-right">
        <BaseButton size="lg" :disabled="disabled" :loading="loading" :aria-describedby="disabled && hint ? hintId : undefined" @click="emit('action')">{{ actionLabel }}</BaseButton>
        <p v-if="disabled && hint" :id="hintId" class="mt-1 text-xs text-q-text-3">{{ hint }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useId } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  label:       { type: String, default: '' },
  amount:      { type: String, default: '—' },
  actionLabel: { type: String, required: true },
  disabled:    Boolean,
  loading:     Boolean,
  hint:        { type: String, default: '' },
  error:       Boolean,
})
const emit = defineEmits(['action', 'retry'])

const hintId = `pay-hint-${useId()}`
</script>
