<template>
  <div class="min-h-screen">

    <!-- ── HERO BANNER SLIDER ──────────────────────────────────── -->
    <section class="relative">
      <Swiper
        v-if="banners.length"
        :modules="SWIPER_MODULES"
        :autoplay="{ delay: 4000, disableOnInteraction: false }"
        :pagination="{ clickable: true }"
        :loop="banners.length > 1"
        class="w-full"
      >
        <SwiperSlide v-for="banner in banners" :key="banner.id">
          <div
            class="relative w-full h-[320px] md:h-[440px] cursor-pointer overflow-hidden"
            @click="$router.push(`/banner/${banner.id}`)"
          >
            <img
              :src="getImgUrl(banner.image_url)"
              :alt="banner.title"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-q-bg/30 to-q-bg" />
            <div class="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
              <h1 class="text-3xl md:text-5xl font-black text-white leading-tight mb-2">
                {{ banner.title }}
              </h1>
              <p v-if="banner.subtitle" class="text-q-text-2 text-sm md:text-base mb-4">
                {{ banner.subtitle }}
              </p>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>

      <div v-else class="w-full h-[320px] md:h-[440px] bg-q-card animate-pulse" />
    </section>

    <div class="max-w-6xl mx-auto px-4">

      <!-- ── QUICK ACTIONS ───────────────────────────────────────── -->
      <section class="py-6">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="action in QUICK_ACTIONS"
            :key="action.label"
            @click="handleQuickAction(action)"
            class="bg-q-card border border-q-border rounded-2xl p-4 cursor-pointer hover:border-q-primary hover:bg-q-card2 transition-all group"
          >
            <div class="text-3xl mb-3">{{ action.icon }}</div>
            <div class="font-bold text-white text-sm mb-1">{{ action.label }}</div>
            <div class="text-q-text-3 text-xs mb-4 leading-relaxed">{{ action.desc }}</div>
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm transition-transform group-hover:translate-x-1"
              :style="{ background: action.color }"
            >
              →
            </div>
          </div>
        </div>
      </section>

      <!-- ── REKOMENDASI RUANGAN ─────────────────────────────────── -->
      <section class="py-2 pb-8">
        <div class="mb-4">
          <h2 class="text-lg font-bold text-white">Rekomendasi Ruangan</h2>
        </div>

        <div v-if="loadingRooms" class="flex gap-3 overflow-x-auto pb-2">
          <div
            v-for="i in 4"
            :key="i"
            class="min-w-[160px] h-[200px] bg-q-card rounded-2xl animate-pulse flex-shrink-0"
          />
        </div>

        <div v-else class="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
          <div
            v-for="room in rooms"
            :key="room.id"
            class="min-w-[160px] md:min-w-0 flex-shrink-0 bg-q-card border border-q-border rounded-2xl overflow-hidden"
          >
            <div class="relative h-28 overflow-hidden">
              <img
                :src="getImgUrl(room.image_url)"
                :alt="room.name"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {{ formatCapacity(room.capacity_min, room.capacity_max) }}
              </div>
            </div>
            <div class="p-3">
              <div class="font-bold text-white text-sm mb-0.5">{{ room.name }}</div>
              <div class="text-q-text-2 text-xs">
                Mulai <span class="text-white font-semibold">{{ formatPrice(room.min_price) }}</span> / jam
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── FEATURE HIGHLIGHTS ──────────────────────────────────── -->
      <section class="py-4 pb-8">
        <div class="bg-q-card border border-q-border rounded-2xl p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="feature in FEATURES" :key="feature.label" class="flex items-center gap-3">
              <div class="text-2xl">{{ feature.icon }}</div>
              <div>
                <div class="text-white text-xs font-semibold">{{ feature.label }}</div>
                <div class="text-q-text-3 text-[11px]">{{ feature.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SOCIAL MEDIA ────────────────────────────────────────── -->
      <section class="py-4 pb-10">
        <div class="bg-q-card border border-q-border rounded-2xl p-5 text-center">
          <div class="text-white font-bold mb-1">Ikuti Kami</div>
          <div class="text-q-text-3 text-sm mb-4">Update game & promo terbaru!</div>
          <div class="flex items-center justify-center gap-4">
            <a
              v-for="social in SOCIALS"
              :key="social.label"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              :class="['w-10 h-10 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform', social.bg]"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path :d="social.svgPath" />
              </svg>
            </a>
          </div>
        </div>
      </section>

    </div>

    <LoginPromptModal v-model="showLoginPrompt" />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import LoginPromptModal from '@/components/LoginPromptModal.vue'
import { useAuthStore } from '@/stores/authStore'
import { getBanners } from '@/api/bannerApi'
import { getRoomRecommendations, getRoomTemplates } from '@/api/roomApi'

const router    = useRouter()
const authStore = useAuthStore()

const SWIPER_MODULES = [Autoplay, Pagination]

const QUICK_ACTIONS = [
  { label: 'Booking',               icon: '📅', desc: 'Book room favoritmu sekarang', color: '#7C3AED', path: '/booking',       requiresAuth: true },
  { label: 'Top Up Play Credits',   icon: '💳', desc: 'Lebih hemat pakai credits',    color: '#0EA5E9', path: '/credits',       requiresAuth: true },
  { label: 'Private Event Booking', icon: '🏠', desc: 'Acara seru? Kita siap!',       color: '#10B981', path: '/event-booking', requiresAuth: true },
]

const FEATURES = [
  { icon: '🎮', label: 'Game Terlengkap',    desc: 'Update setiap minggu' },
  { icon: '🍔', label: 'Makanan & Minuman',  desc: 'Harga terjangkau' },
  { icon: '⭐', label: 'Points & Rewards',   desc: 'Kumpulkan & tukarkan' },
  { icon: '🛡️', label: 'Aman & Terpercaya', desc: 'Privasi terjamin' },
]

const SOCIALS = [
  {
    label: 'Instagram',
    href:  'https://www.instagram.com/quantumgaming.id/',
    bg:    'bg-gradient-to-br from-pink-500 to-orange-400',
    svgPath: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    href:  'https://www.tiktok.com/@quantumgaming.id',
    bg:    'bg-black border border-q-border',
    svgPath: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.83 1.55V6.79a4.85 4.85 0 01-1.06-.1z',
  },
  {
    label: 'YouTube',
    href:  'https://www.youtube.com/@quantumgamingcenter',
    bg:    'bg-red-600',
    svgPath: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
]

const banners      = ref([])
const rooms        = ref([])
const loadingRooms = ref(true)
const showLoginPrompt = ref(false)

const getImgUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  return (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080') + url
}

const formatPrice = (price) => {
  if (!price) return '—'
  return price >= 1000 ? `${Math.round(price / 1000)}RB` : price.toLocaleString('id-ID')
}

const formatCapacity = (min, max) =>
  min === max ? `${max} Orang` : `Hingga ${max} Orang`

const handleQuickAction = (action) => {
  if (action.requiresAuth && !authStore.isLoggedIn) {
    showLoginPrompt.value = true
    return
  }
  router.push(action.path)
}


onMounted(async () => {
  try {
    const { data } = await getBanners()
    banners.value = data.data || []
  } catch {
    banners.value = []
  }

  try {
    loadingRooms.value = true
    if (authStore.isLoggedIn) {
      const { data } = await getRoomRecommendations()
      rooms.value = data.data || []
    }
    if (!rooms.value.length) {
      const { data } = await getRoomTemplates()
      rooms.value = (data.data || []).slice(0, 4)
    }
  } catch {
    rooms.value = []
  } finally {
    loadingRooms.value = false
  }
})
</script>
