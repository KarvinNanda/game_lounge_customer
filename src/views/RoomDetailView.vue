<template>
  <div class="max-w-2xl mx-auto px-4 py-6 pb-24">

    <!-- Back -->
    <button
      @click="$router.back()"
      class="flex items-center gap-2 text-q-text-2 hover:text-white text-sm mb-5 transition-colors"
    >
      ← Kembali
    </button>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-52 bg-q-card rounded-2xl animate-pulse" />
      <div class="h-6 bg-q-card rounded-xl w-2/3 animate-pulse" />
      <div class="h-4 bg-q-card rounded-xl w-1/3 animate-pulse" />
      <div class="h-28 bg-q-card rounded-2xl animate-pulse" />
    </div>

    <template v-else-if="room">

      <!-- Gambar ruangan -->
      <div class="rounded-2xl overflow-hidden mb-5">
        <img
          :src="getImgUrl(room.image_url)"
          :alt="room.name"
          class="w-full h-52 object-cover"
        />
      </div>

      <!-- Nama + kapasitas -->
      <div class="mb-4">
        <h1 class="text-2xl font-bold text-white mb-1">{{ room.name }}</h1>
        <div class="flex items-center gap-2 text-q-text-2 text-sm">
          <span>👥</span>
          <span>{{ capacityLabel }}</span>
        </div>
      </div>

      <!-- Deskripsi -->
      <div v-if="room.description" class="bg-q-card border border-q-border rounded-2xl p-4 mb-4">
        <div class="text-xs font-semibold text-q-text-3 mb-2 uppercase tracking-wide">Deskripsi</div>
        <p class="text-white text-sm leading-relaxed">{{ room.description }}</p>
      </div>

      <!-- Fasilitas -->
      <div v-if="room.facilities?.length" class="bg-q-card border border-q-border rounded-2xl p-4 mb-4">
        <div class="text-xs font-semibold text-q-text-3 mb-3 uppercase tracking-wide">Fasilitas</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="f in room.facilities"
            :key="f.id ?? f.name"
            class="flex items-center gap-1.5 bg-q-card2 border border-q-border
                   text-white text-xs px-3 py-1.5 rounded-full"
          >
            <!-- icon fasilitas kalau ada -->
            <img v-if="f.icon_url"
              :src="getImgUrl(f.icon_url)"
              class="w-4 h-4 object-contain rounded-sm flex-shrink-0"
              :alt="f.name"
            />
            {{ f.name }}
          </span>
        </div>
      </div>

      <!-- Favorit indicator -->
      <div v-if="isFavorite" class="flex items-center gap-2 text-q-gold text-sm mb-4">
        <span>⭐</span>
        <span>Ruangan favorit kamu</span>
      </div>

      <!-- Pilih cabang + Booking CTA — hanya jika sudah login -->
      <div v-if="authStore.isLoggedIn" class="bg-q-card border border-q-border rounded-2xl p-4">
        <div class="text-sm font-semibold text-white mb-3">Booking di Cabang</div>

        <select v-model="selectedStore" class="room-select mb-3">
          <option value="">-- Pilih Cabang --</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <div v-if="selectedStore && minPrice > 0" class="text-q-text-2 text-sm mb-4">
          Mulai dari <span class="text-white font-bold">{{ formatRp(minPrice) }}</span> / jam
        </div>

        <button
          @click="handleBookNow"
          :disabled="!selectedStore"
          class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl shadow-purple
                 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Booking Sekarang →
        </button>
      </div>

      <!-- Login CTA — tampil kalau belum login -->
      <div v-else class="bg-q-card border border-q-border rounded-2xl p-5 text-center">
        <div class="text-3xl mb-3">🔐</div>
        <div class="text-white font-bold mb-1">Login untuk Booking</div>
        <div class="text-q-text-3 text-sm mb-4 leading-relaxed">
          Silakan login terlebih dahulu untuk memilih cabang dan melakukan booking ruangan ini.
        </div>
        <button
          @click="authStore.openAuthModal(`/room/${room.id}`)"
          class="w-full py-3.5 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl
                 shadow-purple transition-colors"
        >
          Login Sekarang →
        </button>
      </div>

    </template>

    <!-- Error state -->
    <div v-else class="text-center py-16">
      <div class="text-5xl mb-4">😕</div>
      <div class="text-white font-bold mb-2">Ruangan tidak ditemukan</div>
      <button @click="$router.push('/')" class="text-q-primary text-sm hover:underline">Kembali ke Beranda</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter }             from 'vue-router'
import { useAuthStore }                    from '@/stores/authStore'
import { getPublicStores, getRoomTemplateById, getPublicRoomTemplates } from '@/api/bookingApi'
import { getImgUrl } from '@/utils/security'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const room          = ref(null)
const stores        = ref([])
const selectedStore = ref('')
const minPrice      = ref(0)
const loading       = ref(true)

const capacityLabel = computed(() => {
  if (!room.value) return ''
  const { capacity_min, capacity_max } = room.value
  return capacity_min === capacity_max
    ? `${capacity_max} Orang`
    : `${capacity_min}–${capacity_max} Orang`
})

const isFavorite = computed(() => {
  if (!authStore.isLoggedIn || !authStore.customer) return false
  const favs = authStore.customer.favorite_room_types || []
  return favs.some(f =>
    f.room_template_id === room.value?.id ||
    f.room_template?.id === room.value?.id
  )
})

// Load harga terendah ketika cabang dipilih
watch(selectedStore, async (storeId) => {
  if (!storeId || !room.value) { minPrice.value = 0; return }
  try {
    const { data } = await getPublicRoomTemplates(storeId)
    const found = (data.data || []).find(r => r.id === room.value.id)
    minPrice.value = found?.min_price || 0
  } catch {
    minPrice.value = 0
  }
})

const handleBookNow = () => {
  if (!selectedStore.value) return
  router.push({
    path:  '/booking',
    query: {
      store_id:         selectedStore.value,
      room_template_id: room.value.id,
    },
  })
}

const formatRp = (p) => 'Rp ' + Math.round(p || 0).toLocaleString('id-ID')

onMounted(async () => {
  try {
    const [roomRes, storeRes] = await Promise.all([
      getRoomTemplateById(route.params.id),
      getPublicStores(),
    ])
    room.value   = roomRes.data.data
    stores.value = storeRes.data.data || []
  } catch {
    room.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.room-select {
  width: 100%; background: var(--color-q-card2);
  border: 1px solid var(--color-q-border); border-radius: 12px;
  padding: 12px 14px; color: white; font-size: 14px;
  outline: none; appearance: none; transition: border-color 0.15s;
}
.room-select:focus { border-color: var(--color-q-primary); }
.room-select option { background: #020B2E; }
</style>
