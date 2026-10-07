<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
        <div data-sheet-backdrop class="sheet-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" @click="close" />

        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="sheet-panel relative z-10 flex w-full max-h-[85dvh] flex-col bg-surface border border-border-subtle rounded-t-3xl md:max-w-md md:rounded-2xl shadow-card"
          style="padding-bottom: env(safe-area-inset-bottom)"
        >
          <header class="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border-subtle">
            <div class="min-w-0">
              <h2 :id="titleId" class="font-display text-lg font-semibold text-q-text">{{ title }}</h2>
              <p v-if="description" class="text-q-text-3 text-xs mt-0.5">{{ description }}</p>
            </div>
            <button
              type="button"
              aria-label="Tutup"
              class="-mr-2 -mt-1 size-11 shrink-0 flex items-center justify-center rounded-full text-q-text-2 hover:text-q-text hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
              @click="close"
            >
              <X class="size-5" aria-hidden="true" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="px-5 py-4 border-t border-border-subtle">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, useId, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps({
  modelValue:  Boolean,
  title:       { type: String, required: true },
  description: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const titleId = `sheet-title-${useId()}`
const panel   = ref(null)
const close   = () => emit('update:modelValue', false)

useFocusTrap(panel, () => props.modelValue)

const onKeydown = (e) => { if (e.key === 'Escape' && props.modelValue) close() }
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.sheet-enter-active .sheet-panel { transition: transform 300ms var(--ease-out-expo), opacity 200ms ease; }
.sheet-leave-active .sheet-panel { transition: transform 200ms ease, opacity 150ms ease; }
.sheet-enter-active .sheet-backdrop,
.sheet-leave-active .sheet-backdrop { transition: opacity 200ms ease; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 300ms; } /* tahan wrapper selama anak beranimasi */
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel   { transform: translateY(40px); opacity: 0; }
.sheet-enter-from .sheet-backdrop,
.sheet-leave-to .sheet-backdrop { opacity: 0; }

@media (min-width: 768px) {
  .sheet-enter-from .sheet-panel,
  .sheet-leave-to .sheet-panel { transform: scale(0.96); }
}
</style>
