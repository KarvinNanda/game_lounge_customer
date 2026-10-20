<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-q-bg/95 backdrop-blur-xl"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Navigasi bawah"
  >
    <span aria-hidden="true" class="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-q-primary-l/60 to-transparent" />
    <div class="flex h-16 items-stretch justify-around px-1">
      <template v-for="item in ITEMS" :key="item.path">
        <!-- Booking: aksi utama, hexagon terangkat di tengah -->
        <button
          v-if="item.center"
          type="button"
          data-nav-center
          :aria-current="isActive(item.path) ? 'page' : undefined"
          class="group relative flex flex-1 cursor-pointer flex-col items-center justify-end gap-1 pb-2 hud-focus"
          @click="navTo(item.path)"
        >
          <span
            aria-hidden="true"
            class="hud-hex -mt-6 flex size-13 items-center justify-center bg-gradient-to-b from-q-primary-strong to-q-primary-d text-white drop-shadow-glow transition-transform duration-150 group-active:scale-95"
          >
            <component :is="item.icon" class="size-6" />
          </span>
          <span class="nav-label" :class="isActive(item.path) ? 'text-q-primary-l' : 'text-q-text-2'">{{ item.label }}</span>
        </button>

        <component
          :is="item.path === '/' ? RouterLink : 'button'"
          v-else
          :to="item.path === '/' ? '/' : undefined"
          :type="item.path === '/' ? undefined : 'button'"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          :class="itemClass(item.path)"
          @click="item.path === '/' ? undefined : navTo(item.path)"
        >
          <span
            aria-hidden="true"
            class="absolute top-0 h-0.5 w-7 transition-opacity duration-150"
            :class="isActive(item.path) ? 'bg-q-primary-l opacity-100 shadow-glow-l' : 'opacity-0'"
          />
          <component :is="item.icon" class="size-5" aria-hidden="true" />
          <span class="nav-label">{{ item.label }}</span>
        </component>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Home, CalendarDays, Gamepad2, Diamond, Tag } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

// Profil pindah ke avatar di top bar (spec 6.3)
const ITEMS = [
  { path: '/',            label: 'Home',        icon: Home },
  { path: '/my-bookings', label: 'My Bookings', icon: CalendarDays },
  { path: '/booking',     label: 'Booking',     icon: Gamepad2, center: true },
  { path: '/my-credits',  label: 'Credits',     icon: Diamond },
  { path: '/promo',       label: 'Promo',       icon: Tag },
]

const isActive  = (path) => (path === '/' ? route.path === '/' : route.path.startsWith(path))
const itemClass = (path) => [
  'relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 transition-colors duration-150 hud-focus',
  isActive(path) ? 'text-q-primary-l' : 'text-q-text-3 hover:text-q-text-2',
]

const navTo = (path) => {
  if (!authStore.isLoggedIn) {
    // Tampilkan LoginPromptModal, bukan hard-redirect ke /login
    authStore.openAuthModal(path)
    return
  }
  router.push(path)
}
</script>

<style scoped>
.nav-label { font-size: 11px; font-weight: 600; line-height: 1; letter-spacing: 0.02em; }
</style>
