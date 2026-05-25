<template>
  <div class="min-h-screen">

    <div class="max-w-2xl mx-auto px-4 py-4">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-q-text-2 hover:text-white transition-colors text-sm"
      >
        ← Kembali
      </button>
    </div>

    <div v-if="loading" class="max-w-2xl mx-auto px-4 space-y-4">
      <div class="w-full h-64 bg-q-card rounded-2xl animate-pulse" />
      <div class="h-6 bg-q-card rounded animate-pulse w-3/4" />
      <div class="h-4 bg-q-card rounded animate-pulse w-1/2" />
    </div>

    <div v-else-if="banner" class="max-w-2xl mx-auto px-4 pb-10">
      <div class="rounded-2xl overflow-hidden mb-6">
        <img
          :src="getImgUrl(banner.detail_image_url || banner.image_url)"
          :alt="banner.title"
          class="w-full object-cover"
        />
      </div>

      <h1 class="text-2xl font-black text-white mb-2">{{ banner.title }}</h1>

      <p v-if="banner.subtitle" class="text-q-primary font-medium mb-4">
        {{ banner.subtitle }}
      </p>

      <div
        v-if="banner.description"
        class="bg-q-card border border-q-border rounded-2xl p-5 text-q-text-2 text-sm leading-relaxed whitespace-pre-line"
      >
        {{ banner.description }}
      </div>

      <!-- <button
        @click="handleCTA"
        class="w-full mt-6 py-4 bg-gradient-purple text-white font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-purple"
      >
        Booking Sekarang
      </button> -->
    </div>

    <div v-else class="text-center py-20 text-q-text-3">
      Banner tidak ditemukan.
    </div>

    <LoginPromptModal v-model="showLoginPrompt" />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginPromptModal from '@/components/LoginPromptModal.vue'
import { useAuthStore } from '@/stores/authStore'
import { getBannerById } from '@/api/bannerApi'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const banner          = ref(null)
const loading         = ref(true)
const showLoginPrompt = ref(false)

const getImgUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  return (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080') + url
}

const handleCTA = () => {
  if (!authStore.isLoggedIn) {
    showLoginPrompt.value = true
    return
  }
  router.push('/booking')
}

onMounted(async () => {
  try {
    const { data } = await getBannerById(route.params.id)
    banner.value = data.data
  } catch {
    banner.value = null
  } finally {
    loading.value = false
  }
})
</script>
