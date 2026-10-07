<template>
  <div>
    <!-- ── HERO ─────────────────────────────────────────────── -->
    <h1 class="sr-only">Quantum Gaming Center</h1>

    <section aria-label="Promo">
      <Swiper
        v-if="banners.length"
        :modules="SWIPER_MODULES"
        :autoplay="{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }"
        :pagination="{ clickable: true }"
        :loop="banners.length > 1"
        class="w-full"
      >
        <SwiperSlide v-for="banner in banners" :key="banner.id">
          <RouterLink
            :to="`/banner/${banner.id}`"
            class="relative block w-full h-[200px] md:h-[340px] overflow-hidden bg-gradient-to-br from-q-card2 via-q-card to-q-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
          >
            <!-- Gambar kosong / gagal dimuat → cukup gradient, jangan tampilkan icon gambar rusak -->
            <img
              v-if="banner.image_url && !failedBanners.has(banner.id)"
              :src="getImgUrl(banner.image_url)"
              alt=""
              class="hero-kenburns w-full h-full object-cover"
              fetchpriority="high"
              @error="failedBanners.add(banner.id)"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-q-bg/30 to-q-bg" aria-hidden="true" />
            <div class="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 sm:px-6 pb-8 md:pb-10">
              <h2 class="font-display text-2xl md:text-4xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                {{ banner.title }}
              </h2>
              <p v-if="banner.subtitle" class="text-q-text-2 text-sm md:text-base mt-1 line-clamp-1">
                {{ banner.subtitle }}
              </p>
            </div>
          </RouterLink>
        </SwiperSlide>
      </Swiper>
      <BaseSkeleton v-else-if="loadingBanners" class="w-full h-[200px] md:h-[340px] !rounded-none" />
      <!-- Banner kosong / gagal dimuat → hero statis, bukan skeleton selamanya -->
      <div
        v-else
        data-hero-fallback
        class="relative w-full h-[200px] md:h-[340px] overflow-hidden bg-gradient-to-br from-q-card2 via-q-card to-q-bg"
      >
        <div class="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 sm:px-6 pb-8 md:pb-10">
          <p class="font-display text-2xl md:text-4xl font-bold text-white leading-tight">Main bareng di Quantum</p>
          <p class="text-q-text-2 text-sm md:text-base mt-1">Booking ruangan, top up credits, dan pesan F&amp;B dalam satu app.</p>
        </div>
      </div>
    </section>

    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- ── QUICK ACTIONS ───────────────────────────────────── -->
      <section class="pt-5 pb-6" aria-label="Aksi cepat">
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <RevealOnScroll v-for="(action, i) in QUICK_ACTIONS" :key="action.label" :delay="i * 60">
            <button
              type="button"
              class="group w-full h-full text-left rounded-2xl border border-border-subtle bg-surface/80 p-3 sm:p-4 cursor-pointer transition-[transform,border-color,box-shadow] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-q-primary/60 hover:shadow-purple-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              @click="handleQuickAction(action)"
            >
              <span class="mb-2 sm:mb-3 inline-flex size-9 sm:size-10 items-center justify-center rounded-xl bg-q-primary/15 text-q-primary-l transition-colors group-hover:bg-q-primary/25">
                <component :is="action.icon" class="size-5" aria-hidden="true" />
              </span>
              <span class="block font-semibold text-q-text text-xs sm:text-sm leading-tight">{{ action.label }}</span>
              <span class="hidden sm:block text-q-text-3 text-xs mt-1 leading-snug">{{ action.desc }}</span>
            </button>
          </RevealOnScroll>
        </div>
      </section>

      <!-- ── REKOMENDASI RUANGAN ─────────────────────────────── -->
      <section class="pb-6" aria-label="Rekomendasi Ruangan">
        <SectionHeader title="Rekomendasi Ruangan" to="/booking" />

        <div v-if="loadingRooms" class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BaseSkeleton v-for="i in 4" :key="i" class="h-44 md:h-52" />
        </div>

        <p v-else-if="!displayRooms.length" class="text-q-text-3 text-sm py-6 text-center">
          Belum ada ruangan tersedia.
        </p>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RevealOnScroll v-for="(room, i) in displayRooms" :key="room.id" :delay="i * 60">
            <BaseCard :tag="RouterLink" :to="`/room/${room.id}`" interactive data-room-card class="block h-full">
              <div class="relative aspect-[4/3] bg-surface-raised overflow-hidden">
                <img
                  v-if="room.image_url"
                  :src="getImgUrl(room.image_url)"
                  :alt="room.name"
                  loading="lazy"
                  class="w-full h-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-q-text-3">
                  <Gamepad2 class="size-8" aria-hidden="true" />
                </div>
                <BaseBadge class="absolute top-2 left-2">
                  <Users class="size-3" aria-hidden="true" />
                  <span aria-hidden="true">{{ room.capacity_max }}</span>
                  <span class="sr-only">Kapasitas hingga {{ room.capacity_max }} orang</span>
                </BaseBadge>
                <BaseBadge v-if="isFavorite(room.id)" tone="gold" class="absolute top-2 right-2">
                  <Star class="size-3" aria-hidden="true" /> Favorit
                </BaseBadge>
              </div>
              <div class="p-3">
                <div class="text-q-text font-semibold text-sm truncate">{{ room.name }}</div>
                <div class="text-q-text-3 text-xs mt-0.5">
                  <template v-if="room.min_price">
                    Mulai <span class="text-q-gold font-semibold">{{ formatRpShort(room.min_price) }}</span> / jam
                  </template>
                  <template v-else>—</template>
                </div>
              </div>
            </BaseCard>
          </RevealOnScroll>
        </div>
      </section>

      <!-- ── FITUR + SOSIAL (satu blok ringkas) ──────────────── -->
      <section class="pb-8" aria-label="Keunggulan">
        <BaseCard class="p-4 md:p-5">
          <ul class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <li v-for="feature in FEATURES" :key="feature.label" class="flex items-center gap-3">
              <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-q-primary-l">
                <component :is="feature.icon" class="size-[18px]" aria-hidden="true" />
              </span>
              <span>
                <span class="block text-q-text text-xs font-semibold">{{ feature.label }}</span>
                <span class="block text-q-text-3 text-xs">{{ feature.desc }}</span>
              </span>
            </li>
          </ul>

          <div class="mt-4 pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
            <p class="text-q-text-2 text-sm">Ikuti kami untuk update game & promo terbaru</p>
            <div class="flex items-center gap-2">
              <a
                v-for="social in SOCIALS"
                :key="social.label"
                :href="social.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="social.label"
                :class="['size-11 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring', social.bg]"
              >
                <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path :d="social.svgPath" />
                </svg>
              </a>
            </div>
          </div>
        </BaseCard>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import { useAuthStore } from '@/stores/authStore'
import { getBanners } from '@/api/bannerApi'
import api from '@/api/index'
import { getImgUrl } from '@/utils/security'
import { CalendarCheck, CreditCard, PartyPopper, Gamepad2, UtensilsCrossed, Award, ShieldCheck, Users, Star } from 'lucide-vue-next'
import BaseCard       from '@/components/ui/BaseCard.vue'
import BaseBadge      from '@/components/ui/BaseBadge.vue'
import BaseSkeleton   from '@/components/ui/BaseSkeleton.vue'
import SectionHeader  from '@/components/ui/SectionHeader.vue'
import RevealOnScroll from '@/components/ui/RevealOnScroll.vue'

const router    = useRouter()
const authStore = useAuthStore()

const SWIPER_MODULES = [Autoplay, Pagination]

const QUICK_ACTIONS = [
  { label: 'Booking',               icon: CalendarCheck, desc: 'Book room favoritmu sekarang', path: '/booking',       requiresAuth: true },
  { label: 'Top Up Play Credits',   icon: CreditCard,    desc: 'Lebih hemat pakai credits',    path: '/credits',       requiresAuth: true },
  { label: 'Private Event Booking', icon: PartyPopper,   desc: 'Acara seru? Kita siap!',       path: '/event-booking', requiresAuth: true },
]

const FEATURES = [
  { icon: Gamepad2,        label: 'Game Terlengkap',    desc: 'Update setiap minggu' },
  { icon: UtensilsCrossed, label: 'Makanan & Minuman',  desc: 'Harga terjangkau' },
  { icon: Award,           label: 'Points & Rewards',   desc: 'Kumpulkan & tukarkan' },
  { icon: ShieldCheck,     label: 'Aman & Terpercaya', desc: 'Privasi terjamin' },
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
const loadingBanners    = ref(true)
const failedBanners     = reactive(new Set()) // id banner yang gambarnya gagal dimuat
const allRoomTemplates    = ref([])   // semua room templates dari API
const recommendedRooms    = ref([])   // semua rooms: favorites dulu, sisanya random
const loadingRooms        = ref(true)

// Minim scroll: Home hanya menampilkan ringkasan, sisanya lewat "Lihat semua"
const ROOM_LIMIT   = 4
const displayRooms = computed(() => recommendedRooms.value.slice(0, ROOM_LIMIT))

// Favorite room template IDs dari customer yang login
const favoriteIds = computed(() => {
  if (!authStore.isLoggedIn || !authStore.customer) return []
  const favs = authStore.customer.favorite_room_types || []
  return favs.map(f => f.room_template_id || f.room_template?.id).filter(Boolean)
})

// Bangun daftar rekomendasi: favorites dulu, sisanya random.
// Tampilan dibatasi ROOM_LIMIT via displayRooms.
const buildRecommendations = () => {
  if (!allRoomTemplates.value.length) return

  const favIds       = favoriteIds.value
  const favorites    = allRoomTemplates.value.filter(r => favIds.includes(r.id))
  const nonFavorites = allRoomTemplates.value.filter(r => !favIds.includes(r.id))
  const shuffled     = [...nonFavorites].sort(() => Math.random() - 0.5)

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
  } finally {
    loadingBanners.value = false
  }

  fetchRooms()
})
</script>
