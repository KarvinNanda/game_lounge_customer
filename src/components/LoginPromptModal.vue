<template>
  <Teleport to="body">
    <Transition name="backdrop-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center md:items-center"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" />

        <Transition name="sheet-slide">
          <div
            v-if="modelValue"
            class="relative w-full max-w-sm bg-q-card border border-q-border rounded-t-3xl md:rounded-2xl z-10 overflow-hidden"
          >
            <button
              @click="$emit('update:modelValue', false)"
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-q-card2 text-q-text-2 hover:text-white transition-colors z-20"
            >
              ✕
            </button>

            <div class="px-7 pt-8 pb-8 text-center">

              <!-- Icon -->
              <div class="flex justify-center mb-5">
                <div class="w-24 h-24 rounded-full bg-q-primary/20 flex items-center justify-center">
                  <div class="w-16 h-16 rounded-full bg-q-primary/30 flex items-center justify-center text-4xl">
                    🔐
                  </div>
                </div>
              </div>

              <h2 class="text-xl font-black text-white mb-2">
                Login Dulu untuk Melanjutkan
              </h2>
              <p class="text-q-text-2 text-sm leading-relaxed mb-6">
                Silakan login untuk mengakses My Bookings,<br />
                Play Credits, dan Profile kamu.
              </p>

              <!-- Benefits -->
              <div class="grid grid-cols-2 gap-3 mb-6">
                <div
                  v-for="benefit in BENEFITS"
                  :key="benefit.label"
                  class="bg-q-primary/10 border border-q-primary/20 rounded-2xl p-3 text-left"
                >
                  <div class="w-8 h-8 rounded-full bg-q-primary/25 flex items-center justify-center text-sm mb-2">
                    {{ benefit.icon }}
                  </div>
                  <div class="text-white text-xs font-semibold leading-tight">{{ benefit.label }}</div>
                </div>
              </div>

              <RouterLink
                :to="{ path: '/login', query: redirectQuery }"
                @click="$emit('update:modelValue', false)"
              >
                <button class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl transition-colors text-base shadow-purple">
                  Login Sekarang
                </button>
              </RouterLink>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { sanitizeRedirect } from '@/utils/security'

const route     = useRoute()
const authStore = useAuthStore()

defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])

const BENEFITS = [
  { icon: '🏷️', label: 'Dapatkan promo eksklusif' },
  { icon: '⭐', label: 'Simpan data & riwayat kamu' },
]

// Gunakan pendingPath dari authStore kalau ada (ditetapkan oleh router guard / navTo)
// Fallback ke route.fullPath kalau modal dibuka secara manual dari dalam halaman.
// sanitizeRedirect: hanya internal path yang lolos — nilai tidak aman → tanpa redirect param
const redirectQuery = computed(() => {
  const raw    = authStore.pendingPath || (route.fullPath !== '/login' ? route.fullPath : '')
  const target = raw ? sanitizeRedirect(raw, '') : ''
  return target ? { redirect: target } : {}
})
</script>

<style scoped>
.backdrop-fade-enter-active,
.backdrop-fade-leave-active { transition: opacity 0.25s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to     { opacity: 0; }

.sheet-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease; }
.sheet-slide-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.sheet-slide-enter-from,
.sheet-slide-leave-to     { transform: translateY(40px); opacity: 0; }

@media (min-width: 768px) {
  .sheet-slide-enter-from,
  .sheet-slide-leave-to { transform: scale(0.95) translateY(0); }
}
</style>
