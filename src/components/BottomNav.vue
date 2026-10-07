<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-50 md:hidden bg-q-bg/95 backdrop-blur-xl border-t border-border-subtle"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Navigasi bawah"
  >
    <div class="flex items-end justify-around h-16 px-2 pb-2">
      <RouterLink to="/" :class="itemClass('/')" :aria-current="isActive('/') ? 'page' : undefined">
        <Home class="size-5" aria-hidden="true" />
        <span class="nav-label">Home</span>
      </RouterLink>

      <button type="button" :class="itemClass('/my-bookings')" :aria-current="isActive('/my-bookings') ? 'page' : undefined" @click="navTo('/my-bookings')">
        <CalendarDays class="size-5" aria-hidden="true" />
        <span class="nav-label">My Booking</span>
      </button>

      <button
        type="button"
        data-nav-center
        class="flex flex-1 flex-col items-center justify-end gap-1 h-full cursor-pointer group focus-visible:outline-none"
        :aria-current="isActive('/my-credits') ? 'page' : undefined"
        @click="navTo('/my-credits')"
      >
        <span
          class="-mt-5 size-12 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-q-primary to-q-primary-d shadow-purple transition-transform duration-200 ease-out-expo group-active:scale-95 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus-ring"
        >
          <Gamepad2 class="size-6" aria-hidden="true" />
        </span>
        <span class="nav-label text-q-primary-l">My Credits</span>
      </button>

      <button type="button" :class="itemClass('/promo')" :aria-current="isActive('/promo') ? 'page' : undefined" @click="navTo('/promo')">
        <Tag class="size-5" aria-hidden="true" />
        <span class="nav-label">Promo</span>
      </button>

      <button type="button" :class="itemClass('/profile')" :aria-current="isActive('/profile') ? 'page' : undefined" @click="navTo('/profile')">
        <User class="size-5" aria-hidden="true" />
        <span class="nav-label">Profil</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Home, CalendarDays, Gamepad2, Tag, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const isActive  = (path) => (path === '/' ? route.path === '/' : route.path.startsWith(path))
const itemClass = (path) => [
  'relative flex flex-1 flex-col items-center justify-center gap-1 h-full rounded-lg cursor-pointer transition-colors duration-200',
  'focus-visible:outline-2 focus-visible:outline-focus-ring',
  isActive(path) ? 'text-q-primary-l' : 'text-q-text-3 hover:text-q-text-2',
]

const navTo = (path) => {
  const requiresAuth = ['/my-bookings', '/my-credits', '/promo', '/profile']
  if (requiresAuth.includes(path) && !authStore.isLoggedIn) {
    // Tampilkan LoginPromptModal, bukan hard-redirect ke /login
    authStore.openAuthModal(path)
  } else {
    router.push(path)
  }
}
</script>

<style scoped>
.nav-label { font-size: 11px; font-weight: 600; line-height: 1; }
</style>
