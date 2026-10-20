<template>
  <div class="mx-auto max-w-6xl px-4 pt-3 pb-4 sm:px-6 lg:pt-5">
    <h1 class="sr-only">Quantum Gaming Center</h1>

    <div class="grid grid-cols-1 gap-3 *:min-w-0 lg:grid-cols-3 lg:gap-3.5">
      <!-- ── HERO PROMO ──────────────────────────────────────── -->
      <section aria-label="Promo" class="lg:col-span-2" @focusin="pauseHero" @focusout="resumeHero">
        <HudPanel brackets cut="none" class="h-[124px] lg:h-[196px]">
          <Swiper
            v-if="banners.length"
            :modules="SWIPER_MODULES"
            effect="fade"
            :fade-effect="{ crossFade: true }"
            :speed="300"
            :autoplay="{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }"
            :pagination="{ clickable: true }"
            :loop="banners.length > 1"
            class="hud-cut size-full bg-gradient-to-br from-q-card2 via-q-card to-q-bg shadow-[inset_0_0_0_1px_var(--color-q-border)]"
            @swiper="(s) => { heroSwiper = s }"
            @slide-change="(s) => { activeSlide = s.realIndex }"
          >
            <SwiperSlide v-for="(banner, i) in banners" :key="banner.id">
              <!-- Slide yang tersembunyi (efek fade = opacity 0) tidak boleh bisa difokus -->
              <RouterLink
                :to="`/banner/${banner.id}`"
                :tabindex="i === activeSlide ? undefined : -1"
                :aria-hidden="i === activeSlide ? undefined : 'true'"
                class="relative block size-full overflow-hidden bg-gradient-to-br from-q-card2 via-q-card to-q-bg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
              >
                <!-- Gambar kosong / gagal dimuat → cukup gradient, jangan tampilkan icon gambar rusak -->
                <img
                  v-if="banner.image_url && !failedBanners.has(banner.id)"
                  :src="getImgUrl(banner.image_url)"
                  alt=""
                  class="absolute inset-0 size-full object-cover"
                  :fetchpriority="i === 0 ? 'high' : undefined"
                  @error="failedBanners.add(banner.id)"
                />
                <div class="absolute inset-0 bg-gradient-to-r from-q-bg/90 via-q-bg/50 to-transparent" aria-hidden="true" />
                <div class="relative flex h-full max-w-md flex-col justify-center gap-1 px-4 pb-4 lg:px-6">
                  <HudLabel tone="accent">// PROMO_{{ String(i + 1).padStart(2, '0') }}</HudLabel>
                  <h2 class="font-display text-[17px] leading-tight text-white line-clamp-2 lg:text-[26px]">{{ banner.title }}</h2>
                  <p v-if="banner.subtitle" class="text-sm text-q-text-2 line-clamp-1">{{ banner.subtitle }}</p>
                </div>
              </RouterLink>
            </SwiperSlide>
          </Swiper>
          <BaseSkeleton v-else-if="loadingBanners" class="size-full" />
          <!-- Banner kosong / gagal dimuat → hero statis, bukan skeleton selamanya -->
          <div
            v-else
            data-hero-fallback
            class="hud-cut relative flex size-full flex-col justify-center gap-1 overflow-hidden bg-gradient-to-br from-q-card2 via-q-card to-q-bg px-4 shadow-[inset_0_0_0_1px_var(--color-q-border)] lg:px-6"
          >
            <span aria-hidden="true" class="absolute -right-10 -top-10 size-40 rotate-45 border border-q-primary-l/30 lg:size-64" />
            <HudLabel tone="accent">// WELCOME</HudLabel>
            <p class="font-display text-[17px] leading-tight text-white lg:text-[26px]">Main bareng di Quantum</p>
            <p class="text-sm text-q-text-2">Booking ruangan, top up credits, dan pesan F&amp;B dalam satu app.</p>
          </div>
        </HudPanel>
      </section>

      <!-- ── STATUS PEMAIN: sesi + credits (kanan di desktop) ── -->
      <div v-if="authStore.isLoggedIn" class="grid content-start gap-3 lg:gap-3.5">
        <HudPanel
          v-if="session"
          data-session-card
          :tone="sessionKind === 'ongoing' ? 'active' : 'default'"
          class="flex items-center gap-3 px-3.5 py-3"
        >
          <div class="min-w-0 flex-1">
            <HudLabel :tone="sessionKind === 'ongoing' ? 'success' : 'accent'" class="flex items-center gap-1.5">
              <span aria-hidden="true" class="size-1.5 bg-current" />{{ sessionKind === 'ongoing' ? 'SEDANG MAIN' : 'NEXT SESSION' }}
            </HudLabel>
            <p class="mt-1 truncate font-display text-[15px] uppercase leading-tight text-q-text">
              {{ session.room?.room_template?.name }} · {{ sessionTime }}
            </p>
            <p class="mt-0.5 truncate text-xs text-q-text-3">
              {{ session.store?.name }} · <span class="font-mono text-q-primary-l">{{ session.booking_code }}</span>
            </p>
          </div>
          <BaseButton v-if="sessionKind === 'ongoing'" :to="fnbOrderLink(session)" size="sm">
            <UtensilsCrossed class="size-4" aria-hidden="true" /> Pesan F&amp;B
          </BaseButton>
          <RouterLink v-else to="/my-bookings" class="hud-label inline-flex min-h-11 shrink-0 items-center gap-0.5 text-q-primary-l! hud-focus">
            Detail <ChevronRight class="size-3.5" aria-hidden="true" />
          </RouterLink>
        </HudPanel>

        <HudPanel :tag="RouterLink" to="/my-credits" interactive data-credits-card class="hidden px-3.5 py-3 lg:block">
          <HudLabel>Play Credits</HudLabel>
          <template v-if="topCredit">
            <div class="mt-1 flex items-baseline justify-between gap-2">
              <p class="truncate font-semibold text-q-text">{{ topCredit.package?.name }}</p>
              <p class="shrink-0 text-xs" :class="expiry.state === 'soon' ? 'text-q-gold' : 'text-q-text-3'">{{ expiry.label }}</p>
            </div>
            <div class="my-2 flex gap-0.5" aria-hidden="true">
              <span
                v-for="n in 10"
                :key="n"
                class="h-1.5 flex-1"
                :class="n <= creditSegments ? 'bg-q-primary-l shadow-glow-l' : 'bg-q-card2'"
              />
            </div>
            <p class="text-xs text-q-text-3">{{ topCredit.remaining_hours }} dari {{ topCredit.total_hours }} jam tersisa</p>
          </template>
          <p v-else class="mt-1 text-sm text-q-text-3">Belum punya credits aktif. Top up untuk harga per jam lebih hemat.</p>
        </HudPanel>
      </div>

      <!-- Tamu di desktop: kolom kanan mengajak login -->
      <HudPanel v-else class="hidden flex-col justify-center gap-2 px-4 py-4 lg:flex">
        <HudLabel tone="accent">PLAYER_01</HudLabel>
        <p class="font-display text-[15px] uppercase text-q-text">Masuk untuk mulai main</p>
        <p class="text-sm text-q-text-3">Lihat sesi, sisa credits, dan voucher kamu di sini.</p>
        <div><BaseButton to="/login" size="sm">Login</BaseButton></div>
      </HudPanel>

      <!-- ── AKSI CEPAT ─────────────────────────────────────── -->
      <section aria-label="Aksi cepat" class="lg:col-span-3">
        <div class="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] grid-rows-2 gap-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:grid-rows-1 lg:gap-3.5">
          <HudPanel
            v-for="action in QUICK_ACTIONS"
            :key="action.label"
            tag="button"
            type="button"
            interactive
            data-quick-action
            :tone="action.primary ? 'primary' : 'default'"
            :class="[
              'flex min-h-[64px] flex-col justify-between gap-2 p-3 text-left lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:p-3.5',
              action.primary && 'row-span-2 lg:row-span-1',
              action.desktopOnly && 'hidden lg:flex',
            ]"
            @click="handleQuickAction(action)"
          >
            <component :is="action.icon" class="size-5 shrink-0" :class="action.primary ? 'text-white' : 'text-q-primary-l'" aria-hidden="true" />
            <span class="min-w-0">
              <span class="block font-semibold leading-tight" :class="action.primary ? 'font-display text-base uppercase tracking-wide text-white lg:text-[15px]' : 'text-sm text-q-text'">{{ action.label }}</span>
              <span class="mt-0.5 block text-xs leading-snug" :class="[action.primary ? 'text-q-text-2' : 'text-q-text-3', !action.primary && 'hidden lg:block']">{{ action.desc }}</span>
            </span>
          </HudPanel>
        </div>
      </section>

      <!-- ── REKOMENDASI RUANGAN ─────────────────────────────── -->
      <section aria-label="Rekomendasi Ruangan" class="lg:col-span-3">
        <SectionHeader title="Rekomendasi Ruangan" to="/booking" />

        <div v-if="loadingRooms" class="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3.5">
          <BaseSkeleton v-for="i in 4" :key="i" class="h-[60px] lg:h-[212px]" />
        </div>

        <p v-else-if="!displayRooms.length" class="py-6 text-center text-sm text-q-text-3">
          Belum ada ruangan tersedia.
        </p>

        <div v-else class="grid grid-cols-2 gap-2 *:min-w-0 lg:grid-cols-4 lg:gap-3.5">
          <HudPanel
            v-for="room in displayRooms"
            :key="room.id"
            :tag="RouterLink"
            :to="`/room/${room.id}`"
            interactive
            data-room-card
            class="h-full"
          >
            <div class="flex items-center gap-2.5 p-2 lg:block lg:p-0">
              <div class="hud-cut-sm relative size-11 shrink-0 overflow-hidden bg-surface-raised lg:hud-cut lg:aspect-[16/10] lg:size-auto lg:w-full">
                <img
                  v-if="room.image_url"
                  :src="getImgUrl(room.image_url)"
                  :alt="room.name"
                  loading="lazy"
                  class="size-full object-cover transition-transform duration-300 ease-out-expo group-hover:scale-[1.03]"
                />
                <div v-else class="flex size-full items-center justify-center bg-gradient-to-br from-q-card2 to-q-border text-q-text-3">
                  <Gamepad2 class="size-5 lg:size-8" aria-hidden="true" />
                </div>
                <!-- Wrapper: `hidden` di BaseBadge kalah oleh inline-flex miliknya -->
                <div v-if="isFavorite(room.id)" class="absolute right-2 top-2 hidden lg:block">
                  <BaseBadge tone="gold"><Star class="size-3" aria-hidden="true" /> Favorit</BaseBadge>
                </div>
              </div>
              <div class="min-w-0 lg:px-3 lg:py-2.5">
                <p class="flex items-center gap-1 truncate text-sm font-semibold text-q-text">
                  <Star v-if="isFavorite(room.id)" class="size-3 shrink-0 fill-q-gold text-q-gold lg:hidden" aria-label="Favorit" />
                  <span class="truncate">{{ room.name }}</span>
                </p>
                <p class="mt-0.5 flex items-center gap-1.5 text-xs text-q-text-3">
                  <span v-if="room.min_price"><span class="font-semibold text-q-gold">{{ formatRpShort(room.min_price) }}</span>/jam</span>
                  <span v-else>—</span>
                  <span aria-hidden="true">·</span>
                  <span class="inline-flex items-center gap-0.5">
                    <Users class="size-3" aria-hidden="true" />
                    <span aria-hidden="true">{{ room.capacity_max }}</span>
                    <span class="sr-only">Kapasitas hingga {{ room.capacity_max }} orang</span>
                  </span>
                </p>
              </div>
            </div>
          </HudPanel>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import { useAuthStore } from '@/stores/authStore'
import { useActiveSession } from '@/composables/useActiveSession'
import { useCreditsSummary } from '@/composables/useCreditsSummary'
import { getBanners } from '@/api/bannerApi'
import api from '@/api/index'
import { getImgUrl } from '@/utils/security'
import { formatRpShort, formatDayLabel } from '@/utils/format'
import { expiryState } from '@/utils/dates'
import { fnbOrderLink } from '@/utils/fnb'
import { CalendarCheck, CreditCard, PartyPopper, UtensilsCrossed, Gamepad2, Users, Star, ChevronRight } from 'lucide-vue-next'
import HudPanel       from '@/components/ui/HudPanel.vue'
import HudLabel       from '@/components/ui/HudLabel.vue'
import BaseButton     from '@/components/ui/BaseButton.vue'
import BaseBadge      from '@/components/ui/BaseBadge.vue'
import BaseSkeleton   from '@/components/ui/BaseSkeleton.vue'
import SectionHeader  from '@/components/ui/SectionHeader.vue'

const router    = useRouter()
const authStore = useAuthStore()

const SWIPER_MODULES = [Autoplay, Pagination, EffectFade]

const QUICK_ACTIONS = [
  { label: 'Booking',        icon: CalendarCheck,   desc: 'Pilih room & jam main', path: '/booking',       requiresAuth: true, primary: true },
  { label: 'Top Up Credits', icon: CreditCard,      desc: 'Lebih hemat per jam',   path: '/credits',       requiresAuth: true },
  { label: 'Private Event',  icon: PartyPopper,     desc: 'Ulang tahun, turnamen', path: '/event-booking', requiresAuth: true },
  { label: 'Pesan F&B',      icon: UtensilsCrossed, desc: 'Diantar ke ruanganmu',  path: '/my-bookings',   requiresAuth: true, desktopOnly: true },
]

// ── Sesi & credits pemain ─────────────────────────────────────────
const { session, kind: sessionKind, reload: reloadSession } = useActiveSession()
const { credits, refresh: refreshCredits } = useCreditsSummary()

const sessionTime = computed(() => {
  const s = session.value
  if (!s) return ''
  const start = s.start_time?.slice(0, 5) ?? ''
  if (sessionKind.value === 'ongoing') return `s/d ${s.end_time?.slice(0, 5) ?? ''}`
  return `${formatDayLabel(s.booking_date)} ${start}`
})

const topCredit = computed(() =>
  [...credits.value].sort((a, b) => Number(b.remaining_hours) - Number(a.remaining_hours))[0] ?? null)
const creditSegments = computed(() => {
  const c = topCredit.value
  if (!c?.total_hours) return 0
  return Math.max(1, Math.round((Number(c.remaining_hours) / Number(c.total_hours)) * 10))
})
const expiry = computed(() => expiryState(topCredit.value?.expires_at))

watch(() => authStore.isLoggedIn, () => { reloadSession(); refreshCredits() })

// ── Banner & ruangan ─────────────────────────────────────────────
// Autoplay berhenti selama fokus keyboard ada di hero (spec: jeda saat hover/fokus)
let heroSwiper    = null
const activeSlide = ref(0)
const pauseHero   = () => heroSwiper?.autoplay?.stop()
const resumeHero  = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) heroSwiper?.autoplay?.start() }

const banners           = ref([])
const loadingBanners    = ref(true)
const failedBanners     = reactive(new Set()) // id banner yang gambarnya gagal dimuat
const allRoomTemplates  = ref([])   // semua room templates dari API
const recommendedRooms  = ref([])   // semua rooms: favorites dulu, sisanya random
const loadingRooms      = ref(true)

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

const handleQuickAction = (action) => {
  if (action.requiresAuth && !authStore.isLoggedIn) {
    authStore.openAuthModal(action.path) // pakai global modal dari CustomerLayout
    return
  }
  router.push(action.path)
}

onMounted(async () => {
  refreshCredits()
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
