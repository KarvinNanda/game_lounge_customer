<template>
  <nav class="sticky top-0 z-50 bg-[#080810]/80 backdrop-blur-xl border-b border-[#252540] animate-fade-in-down">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

      <!-- Logo -->
      <RouterLink to="/" class="flex flex-col leading-tight">
        <span class="text-white font-black text-xl tracking-wide">Quantum</span>
        <span class="text-[#6B7280] text-[9px] font-medium tracking-[0.25em] uppercase">Gaming Center</span>
      </RouterLink>

      <!-- Nav Links (desktop) -->
      <div class="hidden md:flex items-center gap-6">
        <RouterLink
          to="/"
          class="relative text-[#9CA3AF] hover:text-white text-sm font-medium transition-colors group"
          :class="{ '!text-white': $route.path === '/' }"
        >
          Home
          <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0282DE] transition-all duration-300 group-hover:w-full" :class="{ 'w-full': $route.path === '/' }"></span>
        </RouterLink>
        <template v-if="authStore.isLoggedIn">
          <button
            @click="navTo('/my-bookings')"
            class="relative text-[#9CA3AF] hover:text-white text-sm font-medium transition-colors group"
            :class="{ '!text-white': $route.path === '/my-bookings' }"
          >
            My Bookings
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0282DE] transition-all duration-300 group-hover:w-full" :class="{ 'w-full': $route.path === '/my-bookings' }"></span>
          </button>
          <button
            @click="navTo('/my-credits')"
            class="relative text-[#9CA3AF] hover:text-white text-sm font-medium transition-colors group"
            :class="{ '!text-white': $route.path === '/my-credits' }"
          >
            Play Credits
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0282DE] transition-all duration-300 group-hover:w-full" :class="{ 'w-full': $route.path === '/my-credits' }"></span>
          </button>
          <button
            @click="navTo('/promo')"
            class="relative text-[#9CA3AF] hover:text-white text-sm font-medium transition-colors group"
            :class="{ '!text-white': $route.path === '/promo' }"
          >
            Promo
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0282DE] transition-all duration-300 group-hover:w-full" :class="{ 'w-full': $route.path === '/promo' }"></span>
          </button>
        </template>
      </div>

      <!-- Right: Bell + Profile / Login -->
      <div class="flex items-center gap-3">

        <!-- Bell notification (logged in only) -->
        <div v-if="authStore.isLoggedIn" class="relative">
          <button
            @click="showBell = !showBell"
            class="w-9 h-9 flex items-center justify-center rounded-full bg-[#11111E] border border-[#252540] text-[#9CA3AF] hover:text-white hover:border-[#0282DE] transition-all"
          >
            🔔
          </button>
          <div
            v-if="expiringCount > 0"
            class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {{ expiringCount }}
          </div>

          <!-- Bell dropdown -->
          <div
            v-if="showBell"
            class="absolute right-0 top-12 w-72 bg-[#11111E] border border-[#252540] rounded-2xl shadow-lg p-4 z-50"
          >
            <div class="text-sm font-bold text-white mb-3">Notifikasi</div>
            <div v-if="!expiringCredits.length" class="text-[#6B7280] text-xs text-center py-4">
              Tidak ada notifikasi baru
            </div>
            <div v-else class="space-y-2">
              <div v-for="cr in expiringCredits" :key="cr.id" class="bg-[#181828] rounded-xl p-3">
                <div class="text-xs font-semibold text-orange-400 mb-0.5">⚠️ Credits hampir habis</div>
                <div class="text-white text-xs font-medium">{{ cr.package?.name }}</div>
                <div class="text-[#6B7280] text-[11px]">
                  Sisa {{ cr.remaining_hours }} jam · Expired {{ formatExpiry(cr.expires_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Login button (guest) -->
        <RouterLink v-if="!authStore.isLoggedIn" to="/login">
          <button class="px-4 py-2 bg-[#0282DE] hover:bg-[#0160A8] text-white text-sm font-semibold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(2,130,222,0.4)]">
            Login
          </button>
        </RouterLink>

        <!-- Profile dropdown (logged in) -->
        <div v-else class="relative">
          <button
            @click="showProfile = !showProfile"
            class="flex items-center gap-2 bg-[#11111E] border border-[#252540] rounded-full pl-1 pr-3 py-1 hover:border-[#0282DE] transition-all"
          >
            <div class="w-7 h-7 rounded-full bg-[#0282DE] flex items-center justify-center text-white font-bold text-xs">
              {{ authStore.customer?.name?.[0]?.toUpperCase() }}
            </div>
            <span class="hidden md:block text-sm font-medium text-white">
              {{ authStore.customer?.name?.split(' ')[0] }}
            </span>
            <span class="text-[#6B7280] text-xs">▾</span>
          </button>

          <!-- Profile dropdown menu -->
          <div
            v-if="showProfile"
            class="absolute right-0 top-12 w-48 bg-[#11111E] border border-[#252540] rounded-2xl shadow-lg overflow-hidden z-50"
          >
            <RouterLink
              to="/profile"
              @click="showProfile = false"
              class="flex items-center gap-2 px-4 py-3 text-sm text-[#9CA3AF] hover:bg-[#181828] hover:text-white transition-colors"
            >
              👤 Profil Saya
            </RouterLink>
            <RouterLink
              to="/my-fnb-orders"
              @click="showProfile = false"
              class="flex items-center gap-2 px-4 py-3 text-sm text-[#9CA3AF] hover:bg-[#181828] hover:text-white transition-colors"
            >
              🍽️ Pesanan FnB
            </RouterLink>
            <div class="border-t border-[#252540]" />
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-[#181828] transition-colors"
            >
              🚪 Keluar
            </button>
          </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter }       from 'vue-router'
import { useAuthStore }                from '@/stores/authStore'
import { useToast }                    from '@/composables/useToast'
import { customerLogout, getCreditsExpiring } from '@/api/authApi'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = useToast()

const showProfile     = ref(false)
const showBell        = ref(false)
const expiringCredits = ref([])
const expiringCount   = ref(0)

// navTo: guard protected routes — redirect to login if not authenticated
const navTo = (path) => {
  showProfile.value = false
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: path } })
  } else {
    router.push(path)
  }
}

const handleLogout = async () => {
  showProfile.value = false
  try { await customerLogout() } catch {}
  authStore.logout()
  router.push('/')
  toast.success('Berhasil keluar dari akun')
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

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>
