<template>
  <nav class="sticky top-0 z-50 border-b border-border-subtle bg-q-bg/85 backdrop-blur-xl" aria-label="Navigasi utama">
    <span aria-hidden="true" class="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-q-primary-l/50 to-transparent" />
    <div class="mx-auto flex h-13 max-w-6xl items-center gap-3 px-4 lg:gap-6 lg:px-6">

      <RouterLink to="/" class="flex flex-col leading-none hud-focus" aria-label="Quantum Gaming Center, ke Home">
        <span class="font-display text-[17px] tracking-[0.06em] text-q-text">QUANTUM</span>
        <span class="mt-1 font-mono text-[8px] font-semibold tracking-[0.3em] text-q-primary-l">GAMING CENTER</span>
      </RouterLink>

      <!-- Desktop links: selalu link asli (middle-click / tab baru tetap jalan) -->
      <div data-nav-links class="mx-auto hidden h-full items-stretch gap-1 lg:flex">
        <RouterLink v-for="link in LINKS" :key="link.path" v-slot="{ href, navigate }" :to="link.path" custom>
          <a
            :href="href"
            :aria-current="isActive(link.path) ? 'page' : undefined"
            :class="linkClass(link.path)"
            @click="onLinkClick($event, navigate, link)"
          >
            {{ link.label }}
            <span
              aria-hidden="true"
              class="absolute inset-x-2.5 bottom-0 h-0.5 transition-opacity duration-150"
              :class="isActive(link.path) ? 'bg-q-primary-l opacity-100 shadow-glow-l' : 'opacity-0'"
            />
          </a>
        </RouterLink>
      </div>

      <div class="ml-auto flex items-center gap-2 lg:ml-0">
        <template v-if="authStore.isLoggedIn">
          <!-- Sisa jam Play Credits -->
          <RouterLink
            to="/my-credits"
            data-credits-chip
            :aria-label="`Sisa ${totalHours} jam Play Credits`"
            class="group relative isolate inline-flex min-h-11 items-center gap-1.5 px-3 font-mono text-xs font-semibold text-q-primary-l hud-press hud-focus"
          >
            <HudFace tone="default" cut="sm" hoverable />
            <Diamond class="size-3.5" aria-hidden="true" />
            <span aria-hidden="true" class="tabular-nums">{{ displayHours }} JAM</span>
          </RouterLink>

          <!-- Bell -->
          <div class="relative">
            <button
              type="button"
              :aria-label="expiringCount > 0 ? `Notifikasi, ${expiringCount} belum dibaca` : 'Notifikasi'"
              :aria-expanded="showBell"
              :class="ICON_BTN"
              @click="toggle('bell')"
            >
              <HudFace tone="default" cut="sm" hoverable />
              <Bell class="size-[18px]" aria-hidden="true" />
            </button>
            <span
              v-if="expiringCount > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-q-red px-1 font-mono text-[10px] font-bold text-q-bg"
              aria-hidden="true"
            >{{ expiringCount }}</span>

            <Transition name="pop">
              <div v-if="showBell" :class="[MENU, 'w-72 p-4']">
                <HudFace tone="default" />
                <p class="hud-label mb-3">Notifikasi</p>
                <div v-if="!expiringCredits.length" class="py-4 text-center text-xs text-q-text-3">
                  Tidak ada notifikasi baru
                </div>
                <ul v-else class="space-y-2">
                  <li v-for="cr in expiringCredits" :key="cr.id" class="relative isolate p-3">
                    <HudFace tone="raised" cut="sm" />
                    <div class="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-q-gold">
                      <TriangleAlert class="size-3.5" aria-hidden="true" /> Credits hampir habis
                    </div>
                    <div class="text-xs font-medium text-q-text">{{ cr.package?.name }}</div>
                    <div class="text-[11px] text-q-text-2">
                      Sisa {{ cr.remaining_hours }} jam · Expired {{ formatExpiry(cr.expires_at) }}
                    </div>
                  </li>
                </ul>
              </div>
            </Transition>
          </div>

          <!-- Profile -->
          <div class="relative">
            <button
              type="button"
              aria-label="Menu profil"
              :aria-expanded="showProfile"
              class="group relative isolate flex min-h-11 cursor-pointer items-center gap-2 pl-1.5 pr-1.5 lg:pr-3 hud-press hud-focus"
              @click="toggle('profile')"
            >
              <HudFace tone="default" cut="sm" hoverable />
              <span class="hud-hex flex size-8 items-center justify-center bg-gradient-to-br from-q-primary-l to-q-primary-strong text-xs font-bold text-white" aria-hidden="true">
                {{ authStore.customer?.name?.[0]?.toUpperCase() }}
              </span>
              <span class="hidden text-sm font-semibold text-q-text lg:block">
                {{ authStore.customer?.name?.split(' ')[0] }}
              </span>
              <ChevronDown class="hidden size-4 text-q-text-3 transition-transform duration-150 lg:block" :class="{ 'rotate-180': showProfile }" aria-hidden="true" />
            </button>

            <Transition name="pop">
              <div v-if="showProfile" :class="[MENU, 'w-52 py-1']">
                <HudFace tone="default" />
                <RouterLink to="/profile" :class="MENU_ITEM" @click="closeMenus">
                  <User class="size-4" aria-hidden="true" /> Profil Saya
                </RouterLink>
                <RouterLink to="/my-fnb-orders" :class="MENU_ITEM" @click="closeMenus">
                  <UtensilsCrossed class="size-4" aria-hidden="true" /> Pesanan F&amp;B
                </RouterLink>
                <div class="mx-3 my-1 border-t border-border-subtle" />
                <button type="button" :class="[MENU_ITEM, 'w-full text-q-red! hover:text-q-red!']" @click="handleLogout">
                  <LogOut class="size-4" aria-hidden="true" /> Keluar
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Guest -->
        <BaseButton v-else to="/login" size="sm">Login</BaseButton>
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore }                from '@/stores/authStore'
import { useToast }                    from '@/composables/useToast'
import { useCreditsSummary }           from '@/composables/useCreditsSummary'
import { useCountUp }                  from '@/composables/useCountUp'
import { customerLogout, getCreditsExpiring } from '@/api/authApi'
import { Bell, ChevronDown, User, UtensilsCrossed, LogOut, TriangleAlert, Diamond } from 'lucide-vue-next'
import BaseButton                      from '@/components/ui/BaseButton.vue'
import HudFace                         from '@/components/ui/HudFace.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = useToast()

const { totalHours, refresh: refreshCredits } = useCreditsSummary()
const displayHours = useCountUp(totalHours)

const showProfile     = ref(false)
const showBell        = ref(false)
const expiringCredits = ref([])
const expiringCount   = ref(0)

const LINKS = [
  { path: '/',            label: 'Home' },
  { path: '/booking',     label: 'Booking',      requiresAuth: true },
  { path: '/my-bookings', label: 'My Bookings',  requiresAuth: true },
  { path: '/my-credits',  label: 'Play Credits', requiresAuth: true },
  { path: '/promo',       label: 'Promo',        requiresAuth: true },
]

const ICON_BTN  = 'group relative isolate size-11 flex items-center justify-center text-q-text-2 hover:text-q-primary-l cursor-pointer hud-press hud-focus'
const MENU      = 'absolute right-0 top-13 z-50 isolate origin-top-right drop-shadow-[0_8px_24px_rgb(0_0_0/0.6)]'
const MENU_ITEM = 'flex items-center gap-2.5 min-h-11 px-4 text-sm text-q-text-2 hover:bg-q-primary/10 hover:text-q-text transition-colors cursor-pointer hud-focus'

const isActive  = (path) => (path === '/' ? route.path === '/' : route.path.startsWith(path))
const linkClass = (path) => [
  'relative inline-flex items-center px-3.5 text-sm font-semibold transition-colors hud-focus',
  isActive(path) ? 'text-q-text bg-gradient-to-b from-transparent to-q-primary/15' : 'text-q-text-2 hover:text-q-text',
]

// Tamu yang klik link terproteksi → modal login, bukan redirect
const onLinkClick = (e, navigate, link) => {
  if (link.requiresAuth && !authStore.isLoggedIn) {
    e.preventDefault()
    authStore.openAuthModal(link.path)
    return
  }
  navigate(e)
}

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

// Login/logout di tab ini → chip ikut berubah
watch(() => authStore.isLoggedIn, () => refreshCredits())

// Setelah bayar (credits terpakai / dibeli) atau buka Play Credits → angka chip harus baru
const CREDIT_REFRESH_PATHS = ['/payment/success', '/credits/success', '/my-credits']
watch(() => route.path, (path) => { if (CREDIT_REFRESH_PATHS.includes(path)) refreshCredits() })

let pollInterval = null

onMounted(() => {
  fetchExpiringCredits()
  refreshCredits()
  pollInterval = setInterval(fetchExpiringCredits, 5 * 60 * 1000)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  window.removeEventListener('keydown', onKeydown)
})
</script>
