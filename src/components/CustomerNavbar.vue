<template>
  <nav class="sticky top-0 z-50 bg-q-bg/80 backdrop-blur-xl border-b border-border-subtle" aria-label="Navigasi utama">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

      <RouterLink to="/" class="flex flex-col leading-tight rounded-md focus-visible:outline-2 focus-visible:outline-focus-ring">
        <span class="font-display text-q-text font-bold text-xl tracking-wide">Quantum</span>
        <span class="text-q-text-3 text-[10px] font-medium tracking-[0.25em] uppercase">Gaming Center</span>
      </RouterLink>

      <!-- Desktop links -->
      <div class="hidden md:flex items-center gap-1">
        <RouterLink to="/" :class="linkClass('/')" :aria-current="isActive('/') ? 'page' : undefined">Home</RouterLink>
        <template v-if="authStore.isLoggedIn">
          <RouterLink
            v-for="link in AUTH_LINKS"
            :key="link.path"
            :to="link.path"
            :class="linkClass(link.path)"
            :aria-current="isActive(link.path) ? 'page' : undefined"
          >
            {{ link.label }}
          </RouterLink>
        </template>
      </div>

      <div class="flex items-center gap-2">
        <!-- Bell -->
        <div v-if="authStore.isLoggedIn" class="relative">
          <button
            type="button"
            :aria-label="expiringCount > 0 ? `Notifikasi, ${expiringCount} belum dibaca` : 'Notifikasi'"
            :aria-expanded="showBell"
            :class="ICON_BTN"
            @click="toggle('bell')"
          >
            <Bell class="size-[18px]" aria-hidden="true" />
          </button>
          <span
            v-if="expiringCount > 0"
            class="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-q-red rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            aria-hidden="true"
          >{{ expiringCount }}</span>

          <Transition name="pop">
            <div v-if="showBell" :class="[MENU, 'w-72 p-4']">
              <div class="text-sm font-semibold text-q-text mb-3">Notifikasi</div>
              <div v-if="!expiringCredits.length" class="text-q-text-3 text-xs text-center py-4">
                Tidak ada notifikasi baru
              </div>
              <ul v-else class="space-y-2">
                <li v-for="cr in expiringCredits" :key="cr.id" class="bg-surface-raised rounded-xl p-3">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-q-gold mb-0.5">
                    <TriangleAlert class="size-3.5" aria-hidden="true" /> Credits hampir habis
                  </div>
                  <div class="text-q-text text-xs font-medium">{{ cr.package?.name }}</div>
                  <div class="text-q-text-3 text-[11px]">
                    Sisa {{ cr.remaining_hours }} jam · Expired {{ formatExpiry(cr.expires_at) }}
                  </div>
                </li>
              </ul>
            </div>
          </Transition>
        </div>

        <!-- Guest -->
        <BaseButton v-if="!authStore.isLoggedIn" to="/login" size="sm" class="rounded-full">Login</BaseButton>

        <!-- Profile -->
        <div v-else class="relative">
          <button
            type="button"
            aria-label="Menu profil"
            :aria-expanded="showProfile"
            class="flex items-center gap-2 min-h-11 bg-surface border border-border-subtle rounded-full pl-1 pr-3 hover:border-q-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            @click="toggle('profile')"
          >
            <span class="size-8 rounded-full bg-q-primary-strong flex items-center justify-center text-white font-bold text-xs" aria-hidden="true">
              {{ authStore.customer?.name?.[0]?.toUpperCase() }}
            </span>
            <span class="hidden md:block text-sm font-medium text-q-text">
              {{ authStore.customer?.name?.split(' ')[0] }}
            </span>
            <ChevronDown class="size-4 text-q-text-3 transition-transform duration-200" :class="{ 'rotate-180': showProfile }" aria-hidden="true" />
          </button>

          <Transition name="pop">
            <div v-if="showProfile" :class="[MENU, 'w-52 py-1']">
              <RouterLink to="/profile" :class="MENU_ITEM" @click="closeMenus">
                <User class="size-4" aria-hidden="true" /> Profil Saya
              </RouterLink>
              <RouterLink to="/my-fnb-orders" :class="MENU_ITEM" @click="closeMenus">
                <UtensilsCrossed class="size-4" aria-hidden="true" /> Pesanan FnB
              </RouterLink>
              <div class="my-1 border-t border-border-subtle" />
              <button type="button" :class="[MENU_ITEM, 'w-full text-q-red hover:text-q-red']" @click="handleLogout">
                <LogOut class="size-4" aria-hidden="true" /> Keluar
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Klik di luar menu → tutup. Di-teleport ke body: backdrop-blur pada <nav>
         membuat elemen fixed di dalamnya hanya selebar nav, bukan seluruh viewport -->
    <Teleport to="body">
      <div v-if="showProfile || showBell" data-menu-overlay class="fixed inset-0 z-40" aria-hidden="true" @click="closeMenus" />
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore }                from '@/stores/authStore'
import { useToast }                    from '@/composables/useToast'
import { customerLogout, getCreditsExpiring } from '@/api/authApi'
import { Bell, ChevronDown, User, UtensilsCrossed, LogOut, TriangleAlert } from 'lucide-vue-next'
import BaseButton                      from '@/components/ui/BaseButton.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = useToast()

const showProfile     = ref(false)
const showBell        = ref(false)
const expiringCredits = ref([])
const expiringCount   = ref(0)

const AUTH_LINKS = [
  { path: '/my-bookings', label: 'My Bookings' },
  { path: '/my-credits',  label: 'Play Credits' },
  { path: '/promo',       label: 'Promo' },
]

const ICON_BTN  = 'relative size-11 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-q-text-2 hover:text-q-text hover:border-q-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'
const MENU      = 'absolute right-0 top-13 z-50 origin-top-right bg-surface border border-border-subtle rounded-2xl shadow-card'
const MENU_ITEM = 'flex items-center gap-2.5 min-h-11 px-4 text-sm text-q-text-2 hover:bg-surface-raised hover:text-q-text transition-colors cursor-pointer'

const isActive  = (path) => (path === '/' ? route.path === '/' : route.path.startsWith(path))
const linkClass = (path) => [
  'relative min-h-11 inline-flex items-center px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer',
  'focus-visible:outline-2 focus-visible:outline-focus-ring',
  isActive(path) ? 'text-q-text bg-white/5' : 'text-q-text-2 hover:text-q-text',
]

const closeMenus = () => { showProfile.value = false; showBell.value = false }
const toggle = (which) => {
  const open = which === 'bell' ? !showBell.value : !showProfile.value
  closeMenus()
  if (which === 'bell') showBell.value = open
  else showProfile.value = open
}
const onKeydown = (e) => { if (e.key === 'Escape') closeMenus() }

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
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  window.removeEventListener('keydown', onKeydown)
})
</script>
