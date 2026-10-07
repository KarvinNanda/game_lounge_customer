<template>
  <div class="mx-auto max-w-2xl px-4 py-6 pb-24">
    <PageHeader v-if="loading || !room" title="Detail Ruangan" back />

    <div v-if="loading" class="space-y-4" aria-busy="true">
      <BaseSkeleton class="h-52" />
      <BaseSkeleton class="h-6 w-2/3 !rounded-md" />
      <BaseSkeleton class="h-28" />
    </div>

    <template v-else-if="room">
      <PageHeader :title="room.name" back />

      <div class="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-q-card2 via-q-card to-q-bg">
        <img
          v-if="room.image_url && !imageFailed"
          :src="getImgUrl(room.image_url)"
          :alt="room.name"
          class="h-52 w-full object-cover"
          @error="imageFailed = true"
        />
        <div v-else class="flex h-52 items-center justify-center text-q-text-3">
          <Gamepad2 class="size-12" aria-hidden="true" />
        </div>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <BaseBadge><Users class="size-3" aria-hidden="true" /> {{ formatCapacity(room.capacity_min, room.capacity_max) }}</BaseBadge>
        <BaseBadge v-if="isFavorite" tone="gold"><Star class="size-3" aria-hidden="true" /> Favorit kamu</BaseBadge>
      </div>

      <p v-if="room.description" class="mb-4 text-sm leading-relaxed text-q-text-2">{{ room.description }}</p>

      <section v-if="room.facilities?.length" class="mb-5" aria-labelledby="facilities-title">
        <h2 id="facilities-title" class="mb-2 text-xs font-semibold uppercase tracking-wide text-q-text-3">Fasilitas</h2>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="f in room.facilities"
            :key="f.id ?? facilityName(f)"
            class="flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs text-q-text"
          >
            <img v-if="f.icon_url" :src="getImgUrl(f.icon_url)" alt="" class="size-4 object-contain" />
            <Check v-else class="size-3.5 text-q-green" aria-hidden="true" />
            {{ facilityName(f) }}
          </li>
        </ul>
      </section>

      <!-- Booking: pilih cabang (login) -->
      <BaseCard v-if="authStore.isLoggedIn" class="p-4">
        <h2 class="mb-3 font-display text-base font-semibold text-q-text">Booking di cabang</h2>
        <BranchStep :stores="stores" :model-value="selectedStore" @select="selectedStore = $event" />
        <p v-if="selectedStore && minPrice > 0" class="mt-3 text-sm text-q-text-2">
          Mulai <span class="font-semibold text-q-gold">{{ formatRp(minPrice) }}</span> / jam
        </p>
        <BaseButton class="mt-4" size="lg" block :disabled="!selectedStore" @click="handleBookNow">
          Booking Sekarang
        </BaseButton>
      </BaseCard>

      <BaseCard v-else class="p-5 text-center">
        <LockKeyhole class="mx-auto mb-3 size-8 text-q-primary-l" aria-hidden="true" />
        <p class="mb-1 font-semibold text-q-text">Login untuk booking</p>
        <p class="mb-4 text-sm text-q-text-3">Masuk dulu untuk memilih cabang dan jam bermain.</p>
        <BaseButton size="lg" block @click="authStore.openAuthModal(`/room/${room.id}`)">Login Sekarang</BaseButton>
      </BaseCard>
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
import BaseCard from '@/components/ui/BaseCard.vue'
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
