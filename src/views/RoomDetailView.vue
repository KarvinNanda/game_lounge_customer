<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:pb-10">
    <PageHeader v-if="loading || !room" title="Detail Ruangan" back />

    <div v-if="loading" class="space-y-4 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0" aria-busy="true">
      <BaseSkeleton class="aspect-video" />
      <div class="space-y-3">
        <BaseSkeleton class="h-6 w-2/3" />
        <BaseSkeleton class="h-28" />
      </div>
    </div>

    <template v-else-if="room">
      <PageHeader :title="room.name" back />

      <div class="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
        <!-- Gambar -->
        <HudPanel brackets cut="none">
          <div class="hud-cut relative aspect-video overflow-hidden bg-gradient-to-br from-q-card2 via-q-card to-q-bg">
            <img
              v-if="room.image_url && !imageFailed"
              :src="getImgUrl(room.image_url)"
              :alt="room.name"
              class="size-full object-cover"
              @error="imageFailed = true"
            />
            <div v-else class="flex size-full items-center justify-center text-q-text-3">
              <Gamepad2 class="size-12" aria-hidden="true" />
            </div>
            <div v-if="isFavorite" class="absolute left-3 top-3">
              <BaseBadge tone="gold"><Star class="size-3" aria-hidden="true" /> Favorit kamu</BaseBadge>
            </div>
          </div>
        </HudPanel>

        <div class="space-y-4">
          <!-- Stat HUD -->
          <dl class="grid grid-cols-2 gap-1.5">
            <HudPanel class="px-3 py-2.5">
              <dt class="hud-label">Kapasitas</dt>
              <dd class="mt-1 flex items-center gap-1.5 font-semibold text-q-text"><Users class="size-4 text-q-primary-l" aria-hidden="true" /> {{ formatCapacity(room.capacity_min, room.capacity_max) }}</dd>
            </HudPanel>
            <HudPanel class="px-3 py-2.5">
              <dt class="hud-label">Harga / jam</dt>
              <dd class="mt-1 font-semibold" :class="minPrice > 0 ? 'text-q-gold' : 'text-q-text-3'">{{ minPrice > 0 ? `Mulai ${formatRp(minPrice)}` : 'Pilih cabang' }}</dd>
            </HudPanel>
          </dl>

          <p v-if="room.description" class="text-sm leading-relaxed text-q-text-2">{{ room.description }}</p>

          <section v-if="room.facilities?.length" aria-labelledby="facilities-title">
            <h2 id="facilities-title" class="hud-label mb-2">Fasilitas</h2>
            <ul class="flex flex-wrap gap-1.5">
              <li
                v-for="f in room.facilities"
                :key="f.id ?? facilityName(f)"
                data-facility
                class="hud-cut-sm flex items-center gap-1.5 bg-surface px-2.5 py-1.5 text-xs text-q-text shadow-[inset_0_0_0_1px_var(--color-q-border)]"
              >
                <img v-if="f.icon_url" :src="getImgUrl(f.icon_url)" alt="" class="size-4 object-contain" />
                <Check v-else class="size-3.5 text-q-green" aria-hidden="true" />
                {{ facilityName(f) }}
              </li>
            </ul>
          </section>

          <!-- Booking: pilih cabang (login) -->
          <section v-if="authStore.isLoggedIn" aria-labelledby="branch-title">
            <h2 id="branch-title" class="hud-label mb-2">Booking di cabang</h2>
            <BranchStep :stores="stores" :model-value="selectedStore" @select="selectedStore = $event" />
            <div v-if="isDesktop" class="mt-4">
              <BaseButton size="lg" block :disabled="!selectedStore" @click="handleBookNow">Booking Sekarang</BaseButton>
              <p v-if="!selectedStore" class="mt-2 text-center text-xs text-q-text-3">Pilih cabang dulu</p>
            </div>
          </section>

          <HudPanel v-else brackets class="p-5 text-center">
            <LockKeyhole class="mx-auto mb-3 size-8 text-q-primary-l" aria-hidden="true" />
            <p class="mb-1 font-display uppercase text-q-text">Login untuk booking</p>
            <p class="mb-4 text-sm text-q-text-3">Masuk dulu untuk memilih cabang dan jam bermain.</p>
            <BaseButton size="lg" block @click="authStore.openAuthModal(`/room/${room.id}`)">Login Sekarang</BaseButton>
          </HudPanel>
        </div>
      </div>

      <!-- HP: CTA menempel di atas BottomNav -->
      <PayBar
        v-if="authStore.isLoggedIn && !isDesktop"
        :label="selectedStore ? 'Mulai' : 'Harga'"
        :amount="minPrice > 0 ? `${formatRp(minPrice)}/jam` : '—'"
        action-label="Booking Sekarang"
        :disabled="!selectedStore"
        hint="Pilih cabang dulu"
        @action="handleBookNow"
      />
    </template>

    <BaseEmptyState
      v-else
      :icon="SearchX"
      title="Ruangan tidak ditemukan"
      text="Ruangan ini mungkin sudah tidak tersedia."
    >
      <BaseButton to="/" variant="secondary">Kembali ke Beranda</BaseButton>
    </BaseEmptyState>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Gamepad2, Users, Star, Check, LockKeyhole, SearchX } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { getPublicStores, getRoomTemplateById, getPublicRoomTemplates } from '@/api/bookingApi'
import { getImgUrl } from '@/utils/security'
import { formatRp, formatCapacity, facilityName } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import PayBar from '@/components/flow/PayBar.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import BranchStep from '@/components/booking/BranchStep.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const room          = ref(null)
const stores        = ref([])
const selectedStore = ref('')
const minPrice      = ref(0)
const loading       = ref(true)
const imageFailed   = ref(false)
const isDesktop     = useMediaQuery('(min-width: 1024px)')

const isFavorite = computed(() => {
  const favs = authStore.customer?.favorite_room_types || []
  return favs.some((f) => f.room_template_id === room.value?.id || f.room_template?.id === room.value?.id)
})

// Harga terendah ruangan ini di cabang yang dipilih
watch(selectedStore, async (storeId) => {
  if (!storeId || !room.value) { minPrice.value = 0; return }
  try {
    const { data } = await getPublicRoomTemplates(storeId)
    minPrice.value = (data.data || []).find((r) => r.id === room.value.id)?.min_price || 0
  } catch {
    minPrice.value = 0
  }
})

// Kontrak dengan BookingView: ?store_id&room_template_id → langsung ke langkah tanggal
const handleBookNow = () => {
  if (!selectedStore.value) return
  router.push({ path: '/booking', query: { store_id: selectedStore.value, room_template_id: room.value.id } })
}

onMounted(async () => {
  try {
    const [roomRes, storeRes] = await Promise.all([getRoomTemplateById(route.params.id), getPublicStores()])
    room.value   = roomRes.data.data
    stores.value = storeRes.data.data || []
  } catch {
    room.value = null
  } finally {
    loading.value = false
  }
})
</script>
