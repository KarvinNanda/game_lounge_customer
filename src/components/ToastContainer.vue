<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      <!-- Error diumumkan segera (assertive); info/sukses/warning menunggu giliran (polite) -->
      <TransitionGroup
        v-for="region in REGIONS"
        :key="region.role"
        name="toast"
        tag="div"
        class="flex flex-col gap-2 empty:hidden"
        :role="region.role"
        :aria-live="region.live"
      >
        <div
          v-for="toast in toasts.filter(region.match)"
          :key="toast.id"
          :data-toast-type="toast.type"
          class="hud-cut-sm flex items-start gap-3 px-4 py-3 cursor-pointer select-none backdrop-blur-md"
          :class="STYLES[toast.type]"
          @click="remove(toast.id)"
        >
          <component :is="ICONS[toast.type]" class="size-5 shrink-0 mt-px" aria-hidden="true" />
          <p class="text-sm font-medium leading-snug flex-1">{{ toast.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CircleCheck, CircleX, TriangleAlert, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const ICONS = { success: CircleCheck, error: CircleX, warning: TriangleAlert, info: Info }

const REGIONS = [
  { role: 'alert',  live: 'assertive', match: (t) => t.type === 'error' },
  { role: 'status', live: 'polite',    match: (t) => t.type !== 'error' },
]

const STYLES = {
  success: 'bg-q-card/95 text-q-text shadow-[inset_3px_0_0_var(--color-q-green),inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-green)_45%,transparent)] [&>svg]:text-q-green',
  error:   'bg-q-card/95 text-q-text shadow-[inset_3px_0_0_var(--color-q-red),inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-red)_45%,transparent)] [&>svg]:text-q-red',
  warning: 'bg-q-card/95 text-q-text shadow-[inset_3px_0_0_var(--color-q-gold),inset_0_0_0_1px_color-mix(in_srgb,var(--color-q-gold)_45%,transparent)] [&>svg]:text-q-gold',
  info:    'bg-q-card/95 text-q-text shadow-[inset_3px_0_0_var(--color-q-primary-l),inset_0_0_0_1px_var(--color-q-border)] [&>svg]:text-q-primary-l',
}
</script>

<style scoped>
.toast-enter-active { transition: opacity 250ms var(--ease-out-expo), transform 300ms var(--ease-out-expo); }
.toast-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.toast-enter-from,
.toast-leave-to     { opacity: 0; transform: translateX(24px); }
.toast-move         { transition: transform 250ms var(--ease-out-expo); }
</style>
