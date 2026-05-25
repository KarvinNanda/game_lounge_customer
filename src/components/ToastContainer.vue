<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-card cursor-pointer select-none"
          :class="STYLES[toast.type]"
          @click="remove(toast.id)"
        >
          <span class="text-lg shrink-0 mt-0.5">{{ ICONS[toast.type] }}</span>
          <p class="text-sm font-medium leading-snug flex-1">{{ toast.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}

const STYLES = {
  success: 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100 backdrop-blur-md',
  error:   'bg-red-950/90    border-red-700/60    text-red-100    backdrop-blur-md',
  warning: 'bg-amber-950/90  border-amber-700/60  text-amber-100  backdrop-blur-md',
  info:    'bg-q-card/95     border-q-border      text-q-text-2   backdrop-blur-md',
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(60px) scale(0.9); }
.toast-leave-to     { opacity: 0; transform: translateX(60px) scale(0.9); }
.toast-move         { transition: transform 0.25s ease; }
</style>
