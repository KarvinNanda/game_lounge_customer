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
        <SwiperSlide v-for="(banner, index) in banners" :key="banner.id">
          <div
            class="relative w-full h-[320px] md:h-[440px] cursor-pointer overflow-hidden group"
            @click="$router.push(`/banner/${banner.id}`)"
          >
            <img
              :src="getImgUrl(banner.image_url)"
              :alt="banner.title"
              class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              :class="index === 0 ? 'animate-fade-in' : ''"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-q-bg/30 to-q-bg" />
            <div class="absolute inset-0 flex flex-col justify-end p-6 md:p-10 animate-fade-in-up delay-200">
              <h1 class="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">
                {{ banner.title }}
              </h1>
              <p v-if="banner.subtitle" class="text-q-text-2 text-sm md:text-base mb-4 drop-shadow">
                {{ banner.subtitle }}
              </p>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>

      <div v-else class="w-full h-[320px] md:h-[440px] bg-q-card animate-pulse" />
    </section>

    <!-- Quick Actions — dalam home-container -->
    <div class="home-container">
      <section class="py-6">
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <div
            v-for="(action, index) in QUICK_ACTIONS"
            :key="action.label"
            @click="handleQuickAction(action)"
            class="bg-q-card glass-panel rounded-2xl p-3 sm:p-4
                   cursor-pointer hover:border-q-primary hover:bg-q-card2 transition-all group animate-fade-in-up hover:-translate-y-1"
            :style="`animation-delay: ${index * 150}ms;`"
          >
            <div class="text-2xl sm:text-3xl mb-2 sm:mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">{{ action.icon }}</div>
            <div class="font-bold text-white text-xs sm:text-sm mb-1 leading-tight group-hover:text-[#19B9EE] transition-colors">{{ action.label }}</div>
            <div class="text-q-text-3 text-[10px] sm:text-xs mb-3 sm:mb-4 leading-relaxed hidden sm:block">
              {{ action.desc }}
            </div>
            <div
              class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center
                     text-white text-xs sm:text-sm transition-transform duration-300 group-hover:translate-x-2 mt-2 sm:mt-0 shadow-lg"
              :style="{ background: action.color }"
            >
              →
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ── REKOMENDASI RUANGAN ───────────────────────────────── -->
    <section class="py-4">

      <!-- Header — sejajar dengan section lain via home-container -->
      <div class="home-container flex items-center justify-between mb-4">
        <h2 class="text-white font-bold text-lg">Rekomendasi Ruangan</h2>
      </div>

      <!-- ── DESKTOP: Swiper carousel, 4 slides tampil, navigate kalau ada lebih ── -->
      <!-- @wheel: Shift+ScrollDown → next, Shift+ScrollUp → prev -->
      <div class="hidden md:block home-container relative" @wheel.passive="onRoomWheel">

        <!-- Loading skeleton -->
        <div v-if="loadingRooms" class="grid grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i"
            class="h-56 bg-q-card rounded-2xl animate-pulse" />
        </div>

        <!-- Swiper Carousel -->
        <template v-else>
          <Swiper
            :modules="ROOM_SWIPER_MODULES"
            :slides-per-view="4"
            :space-between="16"
            :navigation="{
              prevEl: '.room-swiper-prev',
              nextEl: '.room-swiper-next',
              disabledClass: 'room-nav-disabled',
            }"
            :pagination="recommendedRooms.length > 4
              ? { clickable: true, el: '.room-swiper-pagination' }
              : false"
            class="room-swiper"
            @swiper="onRoomSwiper"
          >
            <SwiperSlide v-for="(room, index) in recommendedRooms" :key="room.id">
              <div
                @click="$router.push(`/room/${room.id}`)"
                class="glass-panel rounded-2xl overflow-hidden
                       cursor-pointer transition-all duration-300 group h-full hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(2,130,222,0.2)] animate-fade-in-up"
                :style="`animation-delay: ${index * 100}ms;`"
              >
                <!-- Gambar -->
                <div class="relative h-40 bg-q-card2 overflow-hidden">
                  <img v-if="room.image_url"
                    :src="getImgUrl(room.image_url)" :alt="room.name"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div v-else class="w-full h-full flex items-center justify-center text-4xl transition-transform duration-500 group-hover:scale-110">🎮</div>

                  <!-- Badge kapasitas -->
                  <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm
                              text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                    Hingga {{ room.capacity_max }} Orang
                  </div>

                  <!-- Badge Favorit -->
                  <div v-if="isFavorite(room.id)"
                    class="absolute top-2 right-2 bg-amber-400/90 backdrop-blur-sm text-black
                           text-[10px] font-black px-2 py-0.5 rounded-full
                           flex items-center gap-0.5 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse-slow">
                    ⭐ Favorit
                  </div>
                </div>

                <!-- Info -->
                <div class="p-3 transition-colors duration-300 group-hover:bg-[#020B2E]/60">
                  <div class="text-white font-semibold text-sm truncate group-hover:text-[#19B9EE] transition-colors">{{ room.name }}</div>
                  <div class="text-q-text-3 text-xs mt-0.5">
                    <span v-if="room.min_price">
                      Mulai <span class="text-white font-bold">{{ formatRpShort(room.min_price) }}</span> / jam
                    </span>
                    <span v-else>—</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          <!-- Tombol navigasi ◄ ► — hanya tampil kalau rooms > 4 -->
          <template v-if="recommendedRooms.length > 4">
            <button class="room-swiper-prev room-nav-btn">◀</button>
            <button class="room-swiper-next room-nav-btn room-nav-btn-right">▶</button>
          </template>

          <!-- Pagination dots — hanya kalau > 4 -->
          <div v-if="recommendedRooms.length > 4"
            class="room-swiper-pagination mt-4 flex justify-center" />
        </template>
      </div>

      <!-- ── MOBILE: horizontal scroll ── -->
      <div class="md:hidden">
        <div v-if="loadingRooms"
          class="flex gap-3 px-4 pb-2"
          style="scrollbar-width:none;">
          <div v-for="i in 3" :key="i"
            class="flex-shrink-0 w-44 h-52 bg-q-card rounded-2xl animate-pulse" />
        </div>
        <div v-else
          class="flex gap-3 overflow-x-auto px-4 pb-2 scroll-smooth hide-scrollbar"
          style="-webkit-overflow-scrolling:touch; scrollbar-width:none;">
          <div
            v-for="(room, index) in recommendedRooms"
            :key="room.id"
            @click="$router.push(`/room/${room.id}`)"
            class="flex-shrink-0 w-44 glass-panel rounded-2xl
                   overflow-hidden cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(2,130,222,0.2)] animate-fade-in-up"
            :style="`animation-delay: ${index * 100}ms;`"
          >
            <div class="relative h-28 bg-q-card2 overflow-hidden">
              <img v-if="room.image_url" :src="getImgUrl(room.image_url)" :alt="room.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl transition-transform duration-500 group-hover:scale-110">🎮</div>
              <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px]
                          font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                Hingga {{ room.capacity_max }} Orang
              </div>
              <div v-if="isFavorite(room.id)"
                class="absolute top-2 right-2 bg-amber-400/90 backdrop-blur-sm text-black
                       text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse-slow">
                ⭐ Favorit
              </div>
            </div>
            <div class="p-3 transition-colors duration-300 group-hover:bg-[#020B2E]/60">
              <div class="text-white font-semibold text-sm truncate group-hover:text-[#19B9EE] transition-colors">{{ room.name }}</div>
              <div class="text-q-text-3 text-xs mt-0.5">
                <span v-if="room.min_price">
                  Mulai <span class="text-white font-bold">{{ formatRpShort(room.min_price) }}</span> / jam
                </span>
                <span v-else>—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- Feature Highlights + Social — dalam home-container -->
    <div class="home-container">

      <!-- ── FEATURE HIGHLIGHTS ──────────────────────────────────── -->
      <section class="py-4 pb-8">
        <div class="glass-panel rounded-2xl p-4 animate-fade-in-up delay-300">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(feature, index) in FEATURES" :key="feature.label" class="flex items-center gap-3 group">
              <div class="text-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">{{ feature.icon }}</div>
              <div>
                <div class="text-white text-xs font-semibold group-hover:text-[#19B9EE] transition-colors">{{ feature.label }}</div>
                <div class="text-q-text-3 text-[11px]">{{ feature.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SOCIAL MEDIA ────────────────────────────────────────── -->
      <section class="py-4 pb-10">
        <div class="glass-panel rounded-2xl p-5 text-center animate-fade-in-up delay-400">
          <div class="text-white font-bold mb-1 tracking-wide">Ikuti Kami</div>
          <div class="text-q-text-3 text-sm mb-4">Update game & promo terbaru!</div>
          <div class="flex items-center justify-center gap-4">
            <a
              v-for="social in SOCIALS"
              :key="social.label"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              :class="['w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]', social.bg]"
            >
              <svg class="w-5 h-5 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path :d="social.svgPath" />
              </svg>
            </a>
          </div>
        </div>
      </section>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { useAuthStore } from '@/stores/authStore'
import { getBanners } from '@/api/bannerApi'
import api from '@/api/index'
import { getImgUrl } from '@/utils/security'

const router    = useRouter()
const authStore = useAuthStore()

const SWIPER_MODULES = [Autoplay, Pagination]
const ROOM_SWIPER_MODULES = [Navigation, Pagination]

const QUICK_ACTIONS = [
  { label: 'Booking',               icon: '📅', desc: 'Book room favoritmu sekarang', color: '#0282DE', path: '/booking',       requiresAuth: true },
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

const banners           = ref([])
const allRoomTemplates    = ref([])   // semua room templates dari API
const recommendedRooms    = ref([])   // semua rooms: favorites dulu, sisanya random (tanpa batas)
const loadingRooms        = ref(true)
const roomSwiperInstance  = ref(null) // instance Swiper untuk kontrol manual (Shift+Scroll)

// ── Swiper instance callback ─────────────────────────────────
const onRoomSwiper = (swiper) => {
  roomSwiperInstance.value = swiper
}

// ── Shift + Scroll → navigasi carousel ──────────────────────
// Shift+ScrollDown → slideNext  |  Shift+ScrollUp → slidePrev
const onRoomWheel = (e) => {
  if (!e.shiftKey) return
  if (e.deltaY > 0) {
    roomSwiperInstance.value?.slideNext()
  } else {
    roomSwiperInstance.value?.slidePrev()
  }
}

// Favorite room template IDs dari customer yang login
const favoriteIds = computed(() => {
  if (!authStore.isLoggedIn || !authStore.customer) return []
  const favs = authStore.customer.favorite_room_types || []
  return favs.map(f => f.room_template_id || f.room_template?.id).filter(Boolean)
})

// Bangun daftar rekomendasi: favorites dulu, sisanya random
// Tidak di-cap — semua rooms masuk ke swiper (4 tampil sekaligus, sisanya navigate)
const buildRecommendations = () => {
  if (!allRoomTemplates.value.length) return

  const favIds       = favoriteIds.value
  const favorites    = allRoomTemplates.value.filter(r => favIds.includes(r.id))
  const nonFavorites = allRoomTemplates.value.filter(r => !favIds.includes(r.id))
  const shuffled     = [...nonFavorites].sort(() => Math.random() - 0.5)

  // Semua rooms tanpa batas: favorites di depan, non-favorites random di belakang
  recommendedRooms.value = [...favorites, ...shuffled]
}

// Cek apakah room ini adalah favorite customer
const isFavorite = (roomId) => favoriteIds.value.includes(roomId)

// Fetch semua room templates dari public endpoint
const fetchRooms = async () => {
  loadingRooms.value = true
  try {
    const { data } = await api.get('/public/room-templates')
    allRoomTemplates.value = data.data || []
    buildRecommendations()
  } catch {
    allRoomTemplates.value = []
  } finally {
    loadingRooms.value = false
  }
}

// Rebuild saat login status atau favorites berubah
watch(() => authStore.isLoggedIn, () => buildRecommendations())
watch(() => authStore.customer?.favorite_room_types, () => buildRecommendations(), { deep: true })

// ── Helpers ────────────────────────────────────────────────────

// Format harga singkat: 15RB, 250RB, 1.5JT
const formatRpShort = (price) => {
  if (!price) return '—'
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}JT`
  if (price >= 1_000)     return `${Math.round(price / 1_000)}RB`
  return `Rp ${price}`
}

const formatCapacity = (min, max) =>
  min === max ? `${max} Orang` : `Hingga ${max} Orang`

const handleQuickAction = (action) => {
  if (action.requiresAuth && !authStore.isLoggedIn) {
    authStore.openAuthModal(action.path) // pakai global modal dari CustomerLayout
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

  fetchRooms()
})
</script>

<style scoped>
/* Container utama — semua sections sejajar di sini */
.home-container {
  max-width: 1152px;       /* max-w-6xl */
  margin: 0 auto;
  padding-left: 1rem;      /* 16px mobile */
  padding-right: 1rem;
  --container-padding: 1rem;
}
@media (min-width: 640px) {
  .home-container {
    padding-left: 1.5rem;  /* 24px sm+ */
    padding-right: 1.5rem;
    --container-padding: 1.5rem;
  }
}

/* Room cards scroll: overflow keluar container dengan negative margin */
.rooms-scroll {
  margin-left:  calc(-1 * var(--container-padding));
  margin-right: calc(-1 * var(--container-padding));
  padding-left:  var(--container-padding);
  padding-right: var(--container-padding);
}

/* Sembunyikan scrollbar tapi tetap bisa scroll horizontal */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ── Room Swiper (Desktop) ── */
.room-swiper {
  width: 100%;
  /* biarkan overflow: hidden (default Swiper) — slide ke-5+ harus tersembunyi sampai di-navigate */
}

/* Tombol navigasi ◄ ► */
.room-nav-btn {
  position: absolute;
  top: 40%; /* center pada area gambar */
  transform: translateY(-50%);
  z-index: 10;
  width: 36px;
  height: 36px;
  background: rgba(2, 130, 222, 0.85);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(2, 130, 222, 0.4);
}
.room-nav-btn:hover {
  background: #0282DE;
  transform: translateY(-50%) scale(1.1);
}
.room-swiper-prev   { left: -18px; }
.room-nav-btn-right { right: -18px; }

/* Disabled state di ujung slide */
.room-nav-disabled {
  opacity: 0.3 !important;
  cursor: not-allowed !important;
}

/* Pagination dots */
.room-swiper-pagination :deep(.swiper-pagination-bullet) {
  background: #7A8BA8;
  opacity: 1;
  width: 6px;
  height: 6px;
}
.room-swiper-pagination :deep(.swiper-pagination-bullet-active) {
  background: #0282DE;
  width: 18px;
  border-radius: 3px;
}
</style>
