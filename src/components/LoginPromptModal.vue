<template>
  <Teleport to="body">
    <Transition name="backdrop-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" @click="close" />

        <Transition name="sheet-slide" appear>
          <div
            v-if="modelValue"
            ref="dialogEl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
            class="relative z-10 w-full max-w-sm bg-surface border border-border-subtle rounded-t-3xl md:rounded-2xl shadow-card"
            style="padding-bottom: env(safe-area-inset-bottom)"
          >
            <button
              type="button"
              aria-label="Tutup"
              class="absolute top-3 right-3 size-11 flex items-center justify-center rounded-full text-q-text-2 hover:text-q-text hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
              @click="close"
            >
              <X class="size-5" aria-hidden="true" />
            </button>

            <div class="px-6 pt-8 pb-6 text-center">
              <div class="mx-auto mb-4 size-16 rounded-2xl bg-q-primary/15 border border-q-primary/30 flex items-center justify-center text-q-primary-l">
                <LockKeyhole class="size-7" aria-hidden="true" />
              </div>

              <h2 id="login-prompt-title" class="font-display text-xl font-semibold text-q-text mb-1.5">
                Login Dulu untuk Melanjutkan
              </h2>
              <p class="text-q-text-2 text-sm leading-relaxed mb-5">
                Akses My Bookings, Play Credits, dan Profile kamu.
              </p>

              <ul class="grid grid-cols-2 gap-2 mb-5 text-left">
                <li
                  v-for="benefit in BENEFITS"
                  :key="benefit.label"
                  data-benefit
                  class="flex items-center gap-2 bg-surface-raised/60 border border-border-subtle rounded-xl p-3"
                >
                  <component :is="benefit.icon" class="size-4 shrink-0 text-q-gold" aria-hidden="true" />
                  <span class="text-q-text text-xs font-medium leading-tight">{{ benefit.label }}</span>
                </li>
              </ul>

              <BaseButton ref="loginBtn" :to="{ path: '/login', query: redirectQuery }" size="lg" block @click="close">
                Login Sekarang
              </BaseButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { LockKeyhole, X, Tag, Star } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useAuthStore } from '@/stores/authStore'
import { sanitizeRedirect } from '@/utils/security'

const route     = useRoute()
const authStore = useAuthStore()

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue'])

const BENEFITS = [
  { icon: Tag,  label: 'Dapatkan promo eksklusif' },
  { icon: Star, label: 'Simpan data & riwayat kamu' },
]

const loginBtn  = ref(null)
const dialogEl  = ref(null)

// Tab tidak boleh keluar ke halaman di belakang modal; fokus kembali ke pemicu saat ditutup
useFocusTrap(dialogEl, () => props.modelValue)
const close     = () => emit('update:modelValue', false)
const onKeydown = (e) => { if (e.key === 'Escape' && props.modelValue) close() }

// Fokus ke tombol login saat modal terbuka — keyboard user langsung di aksi utama
watch(() => props.modelValue, async (open) => {
  if (!open) return
  await nextTick()
  loginBtn.value?.$el?.focus?.()
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

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

.sheet-slide-enter-active { transition: transform 300ms var(--ease-out-expo), opacity 200ms ease; }
.sheet-slide-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.sheet-slide-enter-from,
.sheet-slide-leave-to     { transform: translateY(40px); opacity: 0; }

@media (min-width: 768px) {
  .sheet-slide-enter-from,
  .sheet-slide-leave-to { transform: scale(0.95) translateY(0); }
}
</style>
