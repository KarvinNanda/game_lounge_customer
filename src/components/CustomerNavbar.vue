<template>
  <nav class="sticky top-0 z-50 bg-q-bg/90 backdrop-blur-xl border-b border-q-border">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

      <!-- Logo -->
      <RouterLink to="/" class="flex flex-col leading-tight">
        <span class="text-white font-black text-xl tracking-wide">Quantum</span>
        <span class="text-q-text-3 text-[9px] font-medium tracking-[0.25em] uppercase">Gaming Center</span>
      </RouterLink>

      <!-- Nav Links (desktop) -->
      <div class="hidden md:flex items-center gap-6">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.path"
          :to="item.path"
          class="text-q-text-2 hover:text-white text-sm font-medium transition-colors"
          active-class="!text-white"
        >
          {{ item.label }}
        </RouterLink>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">

        <!-- Bell (login only) -->
        <div v-if="authStore.isLoggedIn" class="relative">
          <button
            @click="showBell = !showBell; showProfile = false"
            class="w-9 h-9 flex items-center justify-center rounded-full bg-q-card border border-q-border text-q-text-2 hover:text-white hover:border-q-primary transition-all"
          >
            🔔
          </button>
          <div
            v-if="expiringCount > 0"
            class="absolute -top-1 -right-1 w-4 h-4 bg-q-red rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {{ expiringCount }}
          </div>

          <Transition name="dropdown">
            <div
              v-if="showBell"
              class="absolute right-0 top-12 w-72 bg-q-card border border-q-border rounded-2xl shadow-card p-4 z-50"
            >
              <div class="text-sm font-bold text-white mb-3">Notifikasi</div>
              <div v-if="!expiringCredits.length" class="text-q-text-3 text-xs text-center py-4">
                Tidak ada notifikasi baru
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="cr in expiringCredits"
                  :key="cr.id"
                  class="bg-q-card2 rounded-xl p-3"
                >
                  <div class="text-xs font-semibold text-amber-400 mb-0.5">⚠️ Credits hampir habis</div>
                  <div class="text-white text-xs font-medium">{{ cr.package?.name }}</div>
                  <div class="text-q-text-3 text-[11px]">
                    Sisa {{ cr.remaining_hours }} jam · Expired {{ formatExpiry(cr.expires_at) }}
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Login button -->
        <RouterLink v-if="!authStore.isLoggedIn" to="/login">
          <button class="px-4 py-2 bg-q-primary hover:bg-q-primary-d text-white text-sm font-semibold rounded-full transition-colors shadow-purple-sm">
            Login
          </button>
        </RouterLink>

        <!-- Profile dropdown -->
        <div v-else class="relative">
          <button
            @click="showProfile = !showProfile; showBell = false"
            class="flex items-center gap-2 bg-q-card border border-q-border rounded-full pl-1 pr-3 py-1 hover:border-q-primary transition-all"
          >
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-q-primary to-q-primary-d flex items-center justify-center text-white font-bold text-xs">
              {{ customerInitial }}
            </div>
            <span class="hidden md:block text-sm font-medium text-white">{{ customerFirstName }}</span>
            <svg class="w-3 h-3 text-q-text-3 transition-transform" :class="{ 'rotate-180': showProfile }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <Transition name="dropdown">
            <div
              v-if="showProfile"
              class="absolute right-0 top-12 w-48 bg-q-card border border-q-border rounded-2xl shadow-card overflow-hidden z-50"
            >
              <RouterLink to="/profile" @click="showProfile = false"
                class="flex items-center gap-2.5 px-4 py-3 text-sm text-q-text-2 hover:bg-q-card2 hover:text-white transition-colors">
                <span>👤</span> Profil Saya
              </RouterLink>
              <div class="border-t border-q-border" />
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-q-red hover:bg-red-500/10 transition-colors"
              >
                <span>🚪</span> Keluar
              </button>
            </div>
          </Transition>
        </div>

      </div>
    </div>

    <!-- Overlay to close all dropdowns -->
    <div
      v-if="showProfile || showBell"
      class="fixed inset-0 z-40"
      @click="showProfile = false; showBell = false"
    />
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { customerLogout, getCreditsExpiring } from '@/api/authApi'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = useToast()

const showProfile     = ref(false)
const showBell        = ref(false)
const expiringCredits = ref([])
const expiringCount   = ref(0)

const NAV_ITEMS = [
  // { label: 'Home',         path: '/' },
  // { label: 'Booking',      path: '/booking' },
  // { label: 'Promo',        path: '/promo' },
  // { label: 'Play Credits', path: '/credits' },
]

const customerInitial   = computed(() => authStore.customer?.name?.[0]?.toUpperCase() ?? '')
const customerFirstName = computed(() => authStore.customer?.name?.split(' ')[0] ?? '')

const handleLogout = async () => {
  showProfile.value = false
  try { await customerLogout() } catch {}
  authStore.logout()
  toast.success('Berhasil keluar dari akun')
  router.push('/')
}

const fetchExpiringCredits = async () => {
  if (!authStore.isLoggedIn) return
  try {
    const { data } = await getCreditsExpiring()
    expiringCredits.value = data.data?.credits || []
    expiringCount.value   = data.data?.count   || 0
  } catch {}
}

const formatExpiry = (d) => {
  if (!d) return '—'
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'hari ini'
  if (diff === 1) return 'besok'
  return `${diff} hari lagi`
}

let pollInterval = null
onMounted(() => {
  fetchExpiringCredits()
  pollInterval = setInterval(fetchExpiringCredits, 5 * 60 * 1000)
})
onUnmounted(() => clearInterval(pollInterval))
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-6px) scale(0.97); }
</style>
