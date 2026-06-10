<template>
  <!-- Hanya tampil di mobile (md ke atas: hidden) -->
  <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden
              bg-[#010214]/95 backdrop-blur-xl border-t border-[#063271]">
    <div class="flex items-end justify-around px-2" style="height:60px; padding-bottom:8px;">

      <!-- Home -->
      <RouterLink to="/"
        class="nav-btn"
        :class="route.path === '/' ? 'text-[#0282DE]' : 'text-[#7A8BA8]'">
        <span class="text-xl">🏠</span>
        <span class="nav-label">Home</span>
      </RouterLink>

      <!-- My Bookings -->
      <button @click="navTo('/my-bookings')"
        class="nav-btn"
        :class="route.path.startsWith('/my-bookings') ? 'text-[#0282DE]' : 'text-[#7A8BA8]'">
        <span class="text-xl">📅</span>
        <span class="nav-label">My Booking</span>
      </button>

      <!-- Play Credits — tombol tengah lebih besar -->
      <button @click="navTo('/my-credits')" class="nav-center">
        <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl
                    -mt-5 shadow-[0_0_20px_rgba(2,130,222,0.45)]"
          style="background: linear-gradient(135deg, #0282DE, #0160A8);">
          🎮
        </div>
        <span class="nav-label text-[#0282DE]">My Credits</span>
      </button>

      <!-- Promo -->
      <button @click="navTo('/promo')"
        class="nav-btn"
        :class="route.path.startsWith('/promo') ? 'text-[#0282DE]' : 'text-[#7A8BA8]'">
        <span class="text-xl">🏷️</span>
        <span class="nav-label">Promo</span>
      </button>

      <!-- Profile -->
      <button @click="navTo('/profile')"
        class="nav-btn"
        :class="route.path.startsWith('/profile') ? 'text-[#0282DE]' : 'text-[#7A8BA8]'">
        <span class="text-xl">👤</span>
        <span class="nav-label">Profil</span>
      </button>

    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const navTo = (path) => {
  const requiresAuth = ['/my-bookings', '/credits', '/promo', '/profile']
  if (requiresAuth.includes(path) && !authStore.isLoggedIn) {
    // Tampilkan LoginPromptModal, bukan hard-redirect ke /login
    authStore.openAuthModal(path)
  } else {
    router.push(path)
  }
}
</script>

<style scoped>
.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  height: 100%;
  gap: 2px;
  padding-bottom: 2px;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}
</style>
